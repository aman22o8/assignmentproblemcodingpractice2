const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const app = express();

app.use(express.json());
let db = null;
const dbPath = path.join(__dirname, "twitterClone.db");

const initialisetheServerAndDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3011, () => {
      console.log("SERVER IS RUNNING AT http://localhost:3011/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

const authenticateToken = (request, response, next) => {
  let jwtTooken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtTooken = authHeader.split(" ")[1];
  }
  if (jwtTooken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtTooken, "MY_SECRET_KEY_AMAN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        request.user_id = payload.user_id;
        // console.log(request.user_id);
        next();
      }
    });
  }
};

initialisetheServerAndDB();

app.get("/alluser/", async (request, response) => {
  const getuserall = `SELECT * FROM user;`;
  const ressppo = await db.all(getuserall);
  response.send(ressppo);
});

app.get("/allfollower/", async (request, response) => {
  const getuserall = `SELECT * FROM follower;`;
  const ressppo = await db.all(getuserall);
  response.send(ressppo);
});

app.get("/alltweet/", async (request, response) => {
  const getuserall = `SELECT * FROM tweet;`;
  const ressppo = await db.all(getuserall);
  response.send(ressppo);
});

app.get("/allreply/", async (request, response) => {
  const getuserall = `SELECT * FROM reply;`;
  const ressppo = await db.all(getuserall);
  response.send(ressppo);
});

app.get("/alllike/", async (request, response) => {
  const getuserall = `SELECT * FROM like;`;
  const ressppo = await db.all(getuserall);
  response.send(ressppo);
});

//API 1
app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const checkingtheusername = `SELECT * FROM user WHERE username='${username}';`;
  const dbResponse1 = await db.get(checkingtheusername);
  if (dbResponse1 !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const updatingtheQuery = `INSERT INTO user(username,password,name,gender) VALUES('${username}','${hashedPassword}','${name}','${gender}');`;
      const dbResponse2 = await db.run(updatingtheQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

//API 2

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const checkingtheusername = `SELECT * FROM user WHERE username='${username}';`;
  const dbResponse1 = await db.get(checkingtheusername);
  if (dbResponse1 === undefined) {
    // console.log("user not exist");
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordmatched = await bcrypt.compare(
      password,
      dbResponse1.password
    );
    if (isPasswordmatched) {
      const payload = { username: username, user_id: dbResponse1.user_id };
      console.log(payload);
      const jwtToken = jwt.sign(payload, "MY_SECRET_KEY_AMAN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3

app.get("/user/tweets/feed/", authenticateToken, async (request, response) => {
  let { username } = request;
  const gettingtheQuery = `SELECT user.username AS username,tweet.tweet AS tweet,tweet.date_time AS dateTime FROM user INNER JOIN tweet ON user.user_id=tweet.user_id WHERE username='${username}' 
    ORDER BY
  CAST(strftime('%Y', date_time) AS INTEGER) DESC,
  CAST(strftime('%m', date_time) AS INTEGER) DESC,
  CAST(strftime('%d', date_time) AS INTEGER) DESC,
  CAST(strftime('%H', date_time) AS INTEGER) DESC,
  CAST(strftime('%M', date_time) AS INTEGER) DESC,
  CAST(strftime('%S', date_time) AS INTEGER) DESC
LIMIT
  4;`;
  const DBresponse3 = await db.all(gettingtheQuery);
  response.send(DBresponse3);
});

//API 4
app.get("/user/following/", authenticateToken, async (request, response) => {
  let { username, user_id } = request;
  //   console.log(request);
  const gettingQuery = `SELECT user.name AS name FROM (user INNER JOIN follower ON user.user_id=follower.follower_user_id ) AS T  WHERE follower.following_user_id='${user_id}';`;
  const dbResponse4 = await db.all(gettingQuery);
  response.send(dbResponse4);
  console.log(username);
  console.log(user_id);
});

//API5
app.get("/user/followers/", authenticateToken, async (request, response) => {
  let { username, user_id } = request;
  const gettingQuery = `SELECT user.name AS name FROM (user INNER JOIN follower ON user.user_id=follower.following_user_id ) AS T  WHERE follower.follower_user_id='${user_id}';`;
  const dbResponse5 = await db.all(gettingQuery);
  response.send(dbResponse5);
});

//API 6
app.get("/tweets/:tweetId/", authenticateToken, async (request, response) => {
  let { username, user_id } = request;
  const { tweetId } = request.params;
  const gettingQuery = `SELECT * FROM (user INNER JOIN follower ON user.user_id=follower.follower_user_id ) AS T  INNER JOIN tweet ON tweet.user_id=T.follower_user_id WHERE T.following_user_id=${user_id} AND tweet_id=${tweetId};`;
  const dbResponse6 = await db.get(gettingQuery);
  //   response.send(dbResponse6);
  console.log(dbResponse6);
  if (dbResponse6 === undefined) {
    response.status(401);
    response.send("Invalid Request");
  } else {
    // const gettingQuery66 = `SELECT * FROM (user INNER JOIN follower ON user.user_id=follower.follower_user_id ) AS T  WHERE follower.following_user_id='${user_id}';`;
    // const dbResponse66 = await db.all(gettingQuery66);
    // response.send(dbResponse66);
    const tweetresult = `SELECT T.tweet AS tweet,COUNT(T.reply) AS replies,COUNT(like.like_id) AS likes,tweet.date_time AS dateTime FROM  (tweet INNER JOIN reply ON tweet.tweet_id=reply.tweet_id) AS T INNER JOIN like ON T.tweet_id=like.tweet_id WHERE T.tweet_id=${dbResponse6.tweet_id};`;
    const dbREsponse666 = await db.get(tweetresult);
    response.send(dbREsponse666);
  }
});

//API 7
app.get(
  "/tweets/:tweetId/likes/",
  authenticateToken,
  async (request, response) => {
    let { username, user_id } = request;
    const { tweetId } = request.params;
    const gettingQuery = `SELECT * FROM (user INNER JOIN follower ON user.user_id=follower.follower_user_id ) AS T  INNER JOIN tweet ON tweet.user_id=T.follower_user_id WHERE T.following_user_id=${user_id} AND tweet_id=${tweetId};`;
    const dbResponse6 = await db.get(gettingQuery);
    //   response.send(dbResponse6);
    console.log(dbResponse6);
    if (dbResponse6 === undefined) {
      response.status(401);
      response.send("Invalid Request");
    } else {
      // const gettingQuery66 = `SELECT * FROM (user INNER JOIN follower ON user.user_id=follower.follower_user_id ) AS T  WHERE follower.following_user_id='${user_id}';`;
      // const dbResponse66 = await db.all(gettingQuery66);
      // response.send(dbResponse66);
      const tweetresult = `SELECT user.username AS username FROM  (like INNER JOIN user ON like.user_id=user.user_id)  WHERE like.tweet_id=${dbResponse6.tweet_id};`;
      const dbREsponse666 = await db.all(tweetresult);
      let finalresult = dbREsponse666.map((each) => {
        return each.username;
      });

      //   console.log(finalresult);
      //   console.log({ likes: finalresult });
      response.send({ likes: finalresult });
    }
  }
);

//API 8
app.get(
  "/tweets/:tweetId/replies/",
  authenticateToken,
  async (request, response) => {
    let { username, user_id } = request;
    const { tweetId } = request.params;
    const gettingQuery = `SELECT * FROM (user INNER JOIN follower ON user.user_id=follower.follower_user_id ) AS T  INNER JOIN tweet ON tweet.user_id=T.follower_user_id WHERE T.following_user_id=${user_id} AND tweet_id=${tweetId};`;
    const dbResponse6 = await db.get(gettingQuery);
    //   response.send(dbResponse6);
    console.log(dbResponse6);
    if (dbResponse6 === undefined) {
      response.status(401);
      response.send("Invalid Request");
    } else {
      // const gettingQuery66 = `SELECT * FROM (user INNER JOIN follower ON user.user_id=follower.follower_user_id ) AS T  WHERE follower.following_user_id='${user_id}';`;
      // const dbResponse66 = await db.all(gettingQuery66);
      // response.send(dbResponse66);
      const tweetresult = `SELECT user.name AS name,reply.reply AS reply FROM  (reply INNER JOIN user ON reply.user_id=user.user_id)  WHERE reply.tweet_id=${dbResponse6.tweet_id};`;
      const dbREsponse666 = await db.all(tweetresult);
      //   let finalresult = dbREsponse666.map((each) => {
      //     return each.username;
      //   });

      //   console.log(finalresult);
      //   console.log({ likes: finalresult });
      response.send({ replies: dbREsponse666 });
    }
  }
);

///API 9
app.get("/user/tweets/", authenticateToken, async (request, response) => {
  let { username, user_id } = request;
  const getalltweet = `SELECT T.tweet AS tweet,COUNT(like.like_id) AS likes,COUNT(T.reply) AS replies,tweet.date_time AS dateTime FROM  (tweet INNER JOIN reply ON tweet.tweet_id=reply.tweet_id) AS T INNER JOIN like ON T.tweet_id=like.tweet_id WHERE T.user_id=${user_id} GROUP BY tweet.tweet_id;`;
  const dbresponse9 = await db.all(getalltweet);
  response.send(dbresponse9);
});

//API 10
app.post("/user/tweets/", authenticateToken, async (request, response) => {
  let { username, user_id } = request;
  const { tweet } = request.body;
  const createnewtweetQuery = `INSERT INTO tweet(tweet,user_id) VALUES('${tweet}',${user_id});`;
  const dbresponse10 = await db.run(createnewtweetQuery);
  response.send("Created a Tweet");
});

//API 11
app.delete(
  "/tweets/:tweetId/",
  authenticateToken,
  async (request, response) => {
    let { username, user_id } = request;
    const { tweetId } = request.params;
    const gettingQuery = `SELECT *  FROM tweet WHERE user_id=${user_id};`;
    const verifyresult = await db.all(gettingQuery);
    console.log(verifyresult);

    //   console.log(verifyresult.length);
    let count = 0;
    verifyresult.forEach((ele) => {
      if (ele.tweet_id == tweetId) {
        count = count + 1;
      }
    });
    console.log(count);
    if (count > 0) {
      const deleteQuery = `DELETE FROM tweet WHERE tweet_id=${tweetId} AND user_id=${user_id};`;
      await db.run(deleteQuery);
      response.send("Tweet Removed");
    } else {
      response.status(401);
      response.send("Invalid Request");
    }
  }
);

module.exports = app;
