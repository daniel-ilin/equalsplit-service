// Create the main schema

const db = require("./index");


const sqlConfigure =
  'BEGIN TRANSACTION;\
CREATE TABLE Transaction (\
    OwnerId varchar(255) NOT NULL,\
    Date date,\
    id varchar(255) NOT NULL,\
    SessionId varchar(255) NOT NULL,\
    Description text,\
    Amount bigint\
);\
\
CREATE TABLE Users (\
    Email varchar(255) NOT NULL,\
    id varchar(255) NOT NULL,\
    Name varchar(255) NOT NULL,\
    Password varchar(255) NOT NULL,\
    Code varchar(255) NOT NULL,\
    Active boolean DEFAULT false\
);\
\
CREATE TABLE BadTokens (\
  token text NOT NULL\
);\
\
CREATE TABLE Session (\
    Id varchar(255) NOT NULL,\
    Name varchar(255),\
    OwnerID varchar(255) NOT NULL,\
    SessionCode varchar(255) NOT NULL\
);\
\
CREATE TABLE SessionUsers (\
    sessionId varchar(255) NOT NULL,\
    userId varchar(255) NOT NULL\
);\
\
ALTER TABLE Transaction ADD CONSTRAINT PK_Transaction_id PRIMARY KEY (id);\
\
ALTER TABLE BadTokens ADD CONSTRAINT PK_Token PRIMARY KEY (token);\
\
ALTER TABLE Users ADD CONSTRAINT PK_User_id PRIMARY KEY (id);\
\
ALTER TABLE Session ADD CONSTRAINT PK_Session_id PRIMARY KEY (id);\
\
ALTER TABLE Session ADD CONSTRAINT FK_Session_Ownerid FOREIGN KEY (OwnerId) REFERENCES Users (id) ON DELETE CASCADE ON UPDATE CASCADE;\
\
ALTER TABLE Transaction ADD CONSTRAINT FK_Transaction_Ownerid FOREIGN KEY (OwnerId) REFERENCES Users (id) ON DELETE CASCADE ON UPDATE CASCADE;\
\
ALTER TABLE Transaction ADD CONSTRAINT FK_Transaction_sessionid FOREIGN KEY (SessionId) REFERENCES Session (id) ON DELETE CASCADE ON UPDATE CASCADE;\
\
ALTER TABLE SessionUsers ADD CONSTRAINT FK_SessionUsers_sessionid FOREIGN KEY (SessionId) REFERENCES Session (id) ON DELETE CASCADE ON UPDATE CASCADE;\
\
ALTER TABLE SessionUsers ADD CONSTRAINT FK_SessionUsers_Ownerid FOREIGN KEY (userID) REFERENCES Users (id) ON DELETE CASCADE ON UPDATE CASCADE;\
\
END;';

async function initDb() {
  try {
    await db.asyncQuery(sqlConfigure, (err) => {
      if (err) {
        console.log("Could not create SQL tables,", err);
      } else {        
        console.log("Created SQL tables");
      }
    });
  } catch {
    console.log("Caught error - could not create SQL tables");
  }
}

module.exports = { initDb };
