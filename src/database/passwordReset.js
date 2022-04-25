const { getResetPasswordToken } = require("../../jwt");

function getPasswordResetLink(email) {
    const token = getResetPasswordToken(email)
    const link = process.env.CLIENT_URL + '/passwordreset/' + token
    return link
}

module.exports = { getPasswordResetLink }