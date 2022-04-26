
function getTime() {
    var date;
    date = new Date();
    date = date.getUTCFullYear() + '-' +
        ('00' + (date.getUTCMonth() + 1)).slice(-2) + '-' +
        ('00' + date.getUTCDate()).slice(-2)
    return date
}

function getExpirationDate() {
    var expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 5);    
    expDate = expDate.getUTCFullYear() + '-' +
        ('00' + (expDate.getUTCMonth() + 1)).slice(-2) + '-' +
        ('00' + expDate.getUTCDate()).slice(-2)
    return expDate
}

module.exports = { getTime, getExpirationDate }