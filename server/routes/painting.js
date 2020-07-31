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
router.get(
    "/getUserPaintings/:publickey",
    auth.isAuthorized,
    (req, res, next) => {
        const { publickey } = req.params;
        rethink
            .queryOfPaintings({ publickey, table: process.env.PAINTINGS_TABLE })
            .then((result) => {
                successRes(
                    res,
                    "The user's paintings information is sent",
                    result,
                );
            })
            .catch((err) => {
                logger.error(
                    `query on user ${publickey}'s painting information is not responding!: ${err.message}`,
                );
                err.statusCode = 500;
                err.clientCode = 69;
                err.title = "خطا در سرور";
                err.clientMessage =
                    "در حال حاضر امکان ارسال نقاشی‌های کاربر  وجود ندارد! لطفا لحظاتی بعد اقدام بفرمایید!";
                err.messageEnglish =
                    "Query on user's information is not responding!";
                next(err);
            });
    },
);

router.get("/getPainting/:id", auth.isAuthorized, (req, res, next) => {
    const gene = req.params.id.split("-").map(Number);
    rethink
        .queryOfPaintings({ gene, table: process.env.PAINTINGS_TABLE })
        .then((result) => {
            successRes(res, "The user's paintings information is sent", result);
        })
        .catch((err) => {
            logger.error(
                `query on user ${publickey}'s painting information is not responding!: ${err.message}`,
            );
            err.statusCode = 500;
            err.clientCode = 69;
            err.title = "خطا در سرور";
            err.clientMessage =
                "در حال حاضر امکان ارسال نقاشی‌های کاربر  وجود ندارد! لطفا لحظاتی بعد اقدام بفرمایید!";
            err.messageEnglish =
                "Query on user's information is not responding!";
            next(err);
        });
});

module.exports = router;
