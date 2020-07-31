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
router.get("/getOffers/:paintingKey", auth.isAuthorized, (req, res, next) => {
    const gene = req.params.paintingKey.split("-").map(Number);
    console.log(gene);
    rethink
        .queryOfOffers({ gene, table: process.env.OFFERS_TABLE })
        .then((result) => {
            successRes(res, "The user's offers information is sent", result);
        })
        .catch((err) => {
            logger.error(
                `query on painting ${gene}'s offers information is not responding!: ${err.message}`,
            );
            err.statusCode = 500;
            err.clientCode = 69;
            err.title = "خطا در سرور";
            err.clientMessage =
                "در حال حاضر امکان ارسال نقاشی‌های کاربر  وجود ندارد! لطفا لحظاتی بعد اقدام بفرمایید!";
            err.messageEnglish =
                "Query on offers's information is not responding!";
            next(err);
        });
});

module.exports = router;
