import { ServiceCenterModel } from "../../DB/models/ServiceCenter.model.js";
import { TowTruckModel } from "./../../DB/models/TowTruck.model.js";


/**
 * Finds the nearest ServiceCenter to a given [lng, lat] point.
 */
export const findNearestServiceCenter = async (coordinates) => {
  const [center] = await ServiceCenterModel.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates },
        distanceField: "distanceMeters",
        spherical: true,
        query: { freezedBy: null },
      },
    },
    { $limit: 1 },
  ]);

  if (!center) return null;

  return {
    refId: center._id,
    name: center.name,
    phone: center.phone,
    distanceKm: +(center.distanceMeters / 1000).toFixed(2),
  };
};

/**
 * Finds the nearest available TowTruck to a given [lng, lat] point.
 */
export const findNearestTowTruck = async (coordinates) => {
  const [truck] = await TowTruckModel.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates },
        distanceField: "distanceMeters",
        spherical: true,
        query: { freezedBy: null, isAvailable: true },
      },
    },
    { $limit: 1 },
  ]);

  if (!truck) return null;

  return {
    refId: truck._id,
    name: truck.name,
    phone: truck.phone,
    distanceKm: +(truck.distanceMeters / 1000).toFixed(2),
  };
};