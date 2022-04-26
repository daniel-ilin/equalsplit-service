const { getResetPasswordToken } = require("../../jwt");

function getPasswordResetLink(id, email) {
    const token = getResetPasswordToken(id, email)
    const link = process.env.CLIENT_URL + '/passwordreset/' + token
    return link
}

module.exports = { getPasswordResetLink }