module.exports  = (res, status, message, err) => {
    if (err) {
        console.log(err.red)
    }

    res.status(status).send({
        status: false,
        message: message,
    })
}