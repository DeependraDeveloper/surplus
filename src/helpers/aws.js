import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

//! create s3 instance
var s3 = new AWS.S3({
  maxRetries: 3,
  httpOptions: { timeout: 30000, connectTimeout: 5000 },
  apiVersions: "latest",
  region: "ap-south-1",
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
});

//! upload file to s3 bucket
export function s3Uploader(data, folder, from) {
  console.log("s3Uploader", data, folder);
  return new Promise((resolve, reject) => {
    var params = {
      Bucket: "ting-ting",
      Key: folder,
      Body: from == "api" ? data.buffer : data,
      ACL: "public-read",
    };

    s3.upload(params, async function (err, data) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(data.Location);
      }
    });
  });
}

export default s3Uploader;
