import {v2 as cloudinary} from "cloudinary"
import { response } from "express";
import fs from "fs"

cloudinary.config({
    CLOUD_NAME: process.env.CLOUD_NAME,
    API_KEY: process.env.API_KEY,
    API_SECRET: process.env.API_SECRET
});

const uploadOncloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null
        // upload the file on cloudinary
        const resonse = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // file has been uploaded successfully
        console.log("file is uploadd on cloudinary", response.url);
        return response;

    } catch(error) {
        fs.unlinkSync(localFilePath)
        return null;
    }
}

export {uploadOncloudinary}