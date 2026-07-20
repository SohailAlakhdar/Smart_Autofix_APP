



export const getNearbyServiceCenters = async (req, res) => {
    try {
        const { lat, lng, maxDistance = 10000 } = req.query;

        const serviceCenters = await ServiceCenter.find({
            isActive: true,
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)],
                    },
                    $maxDistance: parseInt(maxDistance, 10),
                },
            },
        }).select("name phone address location specialties rating");

        res.status(200).json({
            success: true,
            count: serviceCenters.length,
            data: serviceCenters,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};