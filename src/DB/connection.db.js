import mongoose from "mongoose";
import { asyncHandler } from "../utils/response.js";
import { ServiceCenterModel } from "./models/ServiceCenter.model.js";

export const connectDB = asyncHandler(async () => {
    const result = await mongoose.connect(process.env.URI);
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
    "name": "Cairo Auto Care",
    "phone": "+201001234567",
    "location": {
      "type": "Point",
      "coordinates": [31.2089, 30.0131],
      "address": "Dokki, Giza",
      "city": "Giza"
    },
    "specialties": ["oil-change", "engine"],
    "workingHours": "Sat-Thu 9:00-22:00",
    "rating": 4.5,
    "ratingsCount": 12
  },
  {
    "name": "Nasr City Motors",
    "phone": "+201009876543",
    "location": {
      "type": "Point",
      "coordinates": [31.3421, 30.0626],
      "address": "Nasr City, Cairo",
      "city": "Cairo"
    },
    "specialties": ["electrical", "oil-change"],
    "workingHours": "Sun-Fri 10:00-20:00",
    "rating": 4.0,
    "ratingsCount": 8
  },
  {
    "name": "Alex Engine Experts",
    "phone": "+201115551111",
    "location": {
      "type": "Point",
      "coordinates": [29.9187, 31.2001],
      "address": "Sidi Gaber, Alexandria",
      "city": "Alexandria"
    },
    "specialties": ["engine", "transmission"],
    "workingHours": "Sat-Thu 8:30-21:00",
    "rating": 4.8,
    "ratingsCount": 32
  },
  {
    "name": "Smart Car Clinic",
    "phone": "+201122223333",
    "location": {
      "type": "Point",
      "coordinates": [31.2506, 30.0444],
      "address": "Downtown Cairo",
      "city": "Cairo"
    },
    "specialties": ["diagnostics", "electrical"],
    "workingHours": "Daily 9:00-23:00",
    "rating": 4.7,
    "ratingsCount": 45
  },
  {
    "name": "Giza Mechanical Center",
    "phone": "+201133334444",
    "location": {
      "type": "Point",
      "coordinates": [31.2012, 29.9876],
      "address": "Haram, Giza",
      "city": "Giza"
    },
    "specialties": ["suspension", "brakes"],
    "workingHours": "Sat-Thu 8:00-20:00",
    "rating": 4.3,
    "ratingsCount": 18
  },
  {
    "name": "AutoFix Mansoura",
    "phone": "+201144445555",
    "location": {
      "type": "Point",
      "coordinates": [31.3785, 31.0409],
      "address": "Mansoura Center",
      "city": "Mansoura"
    },
    "specialties": ["engine", "electrical", "diagnostics"],
    "workingHours": "Sun-Fri 9:00-21:00",
    "rating": 4.6,
    "ratingsCount": 26
  },
  {
    "name": "Delta Auto Service",
    "phone": "+201155556666",
    "location": {
      "type": "Point",
      "coordinates": [31.3807, 30.7906],
      "address": "Tanta Downtown",
      "city": "Tanta"
    },
    "specialties": ["oil-change", "tires", "brakes"],
    "workingHours": "Daily 8:00-22:00",
    "rating": 4.2,
    "ratingsCount": 21
  },
  {
    "name": "Luxor Car Solutions",
    "phone": "+201166667777",
    "location": {
      "type": "Point",
      "coordinates": [32.6396, 25.6872],
      "address": "Luxor City",
      "city": "Luxor"
    },
    "specialties": ["engine", "air-conditioning"],
    "workingHours": "Sat-Thu 9:00-19:00",
    "rating": 4.9,
    "ratingsCount": 51
  },
  {
    "name": "Aswan Auto Garage",
    "phone": "+201177778888",
    "location": {
      "type": "Point",
      "coordinates": [32.8998, 24.0889],
      "address": "Aswan Downtown",
      "city": "Aswan"
    },
    "specialties": ["battery", "electrical", "diagnostics"],
    "workingHours": "Sun-Fri 8:30-18:30",
    "rating": 4.4,
    "ratingsCount": 15
  },
]
// InsertData(ServiceCenterModel, sampleData);
// InsertData(TowTruckModel, sampleData);



