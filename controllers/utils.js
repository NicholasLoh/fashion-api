// Load the AWS SDK for Node.js
const AWS = require("aws-sdk");
const ErrorResponse = require("../utils/ErrorResponse");
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const fs = require("fs");
const del = require("del");

AWS.config.update({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});

// Set the region
AWS.config.update({ region: "ap-southeast-1" });

// Create S3 service object
s3 = new AWS.S3();

//upload files to aws s3 and returns a promise
const uploadToS3 = (file) => {
  return new Promise((resolve, reject) => {
    let fileStream = fs.createReadStream(file.path);
    fileStream.on("error", function (err) {
      console.log("File Error", err);
    });

    fs.readFile(file.path, function (err, data) {
      const params = {
        ACL: "public-read",
        Bucket: process.env.AWS_S3_BUCKET,
        Body: data,
        Key: `${Date.now()}${file.filename}.${file.mimetype.split("/")[1]}`,
      };

      s3.upload(params, function (err, data) {
        if (err) {
          console.log("Error occured while trying to upload to S3 bucket", err);
          reject(err);
        }

        if (data) {
          console.log(data.Location);
          resolve(data.Location);
        }
      });
    });
  });
};

/**
 * @desc Upload photos to aws s3
 * @route GET /api/v1/utils/uploadPhotos
 * @access private
 */
exports.upload = async (req, res, next) => {
  try {
    let promises = [];
    for (let file of req.files) {
      promises.push(uploadToS3(file));
    }

    //wait for all uploads to finish
    let urls = await Promise.all(promises);

    //delete all files in public folder
    const deletedPaths = await del(["public/*"]);

    if (!urls) {
      return next(new ErrorResponse("Upload failed", 500));
    }

    res.status(200).json({
      success: true,
      msg: "Photo(s) uploaded",
      data: urls,
    });
  } catch (err) {
    return next(new ErrorResponse(err, 500));
  }
};
