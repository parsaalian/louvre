var router = require("express").Router();

const logger = require("../api/logger");

const rethink = require("../db/rethinkdb");

const { successRes } = require("../middlewares/response");
var auth = require("../middlewares/auth");
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////// GET ENDPOINTS   /////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////

// This end point takes query on all offers of PolyGame from RethinkDB.
router.get("/getUserInfo", auth.isAuthorized, (req, res, next) => {
    const publickey = req.session.pubKey;
    rethink
        .queryOfUsers({ publickey, table: process.env.USERS_TABLE })
        .then((result) => {
            const user = result[0];
            successRes(res, "The user's information is sent", user);
        })
        .catch((err) => {
            logger.error(
                `query on user ${publickey}'s information is not responding!: ${err.message}`,
            );
            err.statusCode = 500;
            err.clientCode = 69;
            err.title = "خطا در سرور";
            err.clientMessage =
                "در حال حاضر امکان ارسال اطلاعات کاربر  وجود ندارد! لطفا لحظاتی بعد اقدام بفرمایید!";
            err.messageEnglish =
                "Query on user's information is not responding!";
            next(err);
        });
});

module.exports = router;
