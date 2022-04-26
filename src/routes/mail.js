const express = require("express");
const { sendMail } = require("../../mail-service");
const {
  getCodeForUserEmail,
  generateNewCodeForUser,
  getUserByEmail,
} = require("../database/all");
const { getPasswordResetLink } = require("../database/passwordReset");
const checkAccountInactive = require("../middleware/checkAccountInactive");
const router = express.Router();

router.post("/code", checkAccountInactive, async (req, res) => {
  const subject = "Welcome to EqualSplit!";
  try {
    const email = req.body.email;
    await generateNewCodeForUser(email);
    const code = await getCodeForUserEmail(email);
    let message = `Hello!\n
\n
Here is your activation code: \n
${code} \n
If you didn't register with Equal Split, please ignore this email. \n
\n
Best, \n
EqualSplit`;
    await sendMail(email, subject, message, () => {
      res
        .status(200)
        .send({ message: "Check your email to activate the user!" });
    });
  } catch (error) {
    res.status(400).send({ error: `${error}` });
  }
});


router.post("/resetpassword", async (req, res) => {
  const subject = "EqualSplit Password Reset";
  try {
    const email = req.body.email;

    const user = await getUserByEmail(email);

    const link = getPasswordResetLink(user.id, email);

    let message = `Hello!\n
\n
Here is your password reset link: \n
${link} \n
If you don't use it, it will expire in 15 minutes. If you didn't request password reset, please ignore this email. \n
\n
Best, \n
EqualSplit`;
    await sendMail(email, subject, message, () => {
      res
        .status(200)
        .send({ message: "Check your email to reset your password!" });
    });
  } catch (error) {
    res.status(400).send({ error: `${error}` });
  }
});

module.exports = router;
