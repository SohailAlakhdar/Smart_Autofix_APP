import mongoose from "mongoose";
import { asyncHandler } from "../utils/response.js";
import { ServiceCenterModel } from "./models/ServiceCenter.model.js";
import { TowTruckModel } from "./models/TowTruck.model.js";

export const connectDB = asyncHandler(async () => {
    const result = await mongoose.connect(process.env.MONGO_URI);
    console.log("Database Name:", mongoose.connection.name);
    console.log("DB Connected 👌");
});

export const InsertData = asyncHandler(async (Model, data) => {
    const inserted = await Model.insertMany(data)
    console.log("Data inserted:", inserted);
    return inserted;
});


const sampleData =[
  {
    "name": "Fast Rescue Towing",
    "phone": "+201012345678",
    "location": {
      "type": "Point",
      "coordinates": [31.2089, 30.0131]
    },
    "isAvailable": true,
    "rating": 4.5,
    "ratingsCount": 12,
    "ratingsBreakdown": { "1": 0, "2": 0, "3": 1, "4": 4, "5": 7 }
  },
  {
    "name": "Cairo Roadside Assist",
    "phone": "+201098765432",
    "location": {
      "type": "Point",
      "coordinates": [31.2357, 30.0444]
    },
    "isAvailable": false,
    "rating": 3.8,
    "ratingsCount": 5,
    "ratingsBreakdown": { "1": 0, "2": 1, "3": 1, "4": 2, "5": 1 }
  },
  {
    "name": "Nasr City Tow Service",
    "phone": "+201155566677",
    "location": {
      "type": "Point",
      "coordinates": [31.3421, 30.0626]
    },
    "isAvailable": true,
    "rating": 0,
    "ratingsCount": 0,
    "ratingsBreakdown": { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
  },
  {
    "name": "Hurghada Highway Rescue",
    "phone": "+201233344455",
    "location": {
      "type": "Point",
      "coordinates": [33.8116, 27.2579]
    },
    "isAvailable": true,
    "rating": 5,
    "ratingsCount": 3,
    "ratingsBreakdown": { "1": 0, "2": 0, "3": 0, "4": 0, "5": 3 }
  }
]
// InsertData(ServiceCenterModel, sampleData);
// InsertData(TowTruckModel, sampleData);




