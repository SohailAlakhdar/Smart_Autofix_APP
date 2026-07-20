// GET /api/tow-trucks/nearby?lat=30.01&lng=31.21&maxDistance=5000

export const getNearbyTowTrucks = async (req, res) => {
  const { lat, lng, maxDistance = 10000 } = req.query;

  const trucks = await TowTruck.find({
    isAvailable: true,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: parseInt(maxDistance),
      },
    },
  }).select("name phone location rating");

  res.json({
    success: true,
    data: trucks,
  });
};