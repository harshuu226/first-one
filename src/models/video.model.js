import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {

        },

        thumbnail: {

        },

        title: {

        },

        description: {

        },

        duration: {

        },

        views: {

        },

        isPublished: {

        },

        owmer: {
            
        },
    },
    {
        timestaps: true
    }

)
videoSchema.plugin(mongooseAggregatePaginate)
export const video = mongoose.model("video", videoSchema)