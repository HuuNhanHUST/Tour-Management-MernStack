import TourGuide from "../models/TourGuide.js";

// create new tour guide
export const createTourGuide = async (req, res) => {
  const tourGuideData = {
    ...req.body,
  };

  if (req.file) {
    tourGuideData.photo = req.file.path;
  }

  if (req.body.languages) {
    try {
      tourGuideData.languages = JSON.parse(req.body.languages);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid languages format. It should be a JSON array string.",
      });
    }
  }

  const newTourGuide = new TourGuide(tourGuideData);

  try {
    const savedTourGuide = await newTourGuide.save();

    res.status(200).json({
      success: true,
      message: "Successfully created",
      data: savedTourGuide,
    });
  } catch (err) {
    console.error("Error creating tour guide:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create. Try again",
      error: err.message,
    });
  }
};

// update tour guide
export const updateTourGuide = async (req, res) => {
  const id = req.params.id;
  const updateData = {
    ...req.body,
  };

  if (req.file) {
    updateData.photo = req.file.path;
  }

  if (req.body.languages) {
    try {
      updateData.languages = JSON.parse(req.body.languages);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid languages format. It should be a JSON array string.",
      });
    }
  }

  try {
    const updatedTourGuide = await TourGuide.findByIdAndUpdate(
      id,
      {
        $set: updateData,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Successfully updated",
      data: updatedTourGuide,
    });
  } catch (err) {
    console.error("Error updating tour guide:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update",
      error: err.message,
    });
  }
};

// delete tour guide
export const deleteTourGuide = async (req, res) => {
  const id = req.params.id;

  try {
    await TourGuide.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Successfully deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete",
    });
  }
};

// get single tour guide
export const getSingleTourGuide = async (req, res) => {
  const id = req.params.id;

  try {
    const tourGuide = await TourGuide.findById(id);

    res.status(200).json({
      success: true,
      message: "Successfully get single tour guide",
      data: tourGuide,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found",
    });
  }
};

// get all tour guides
export const getAllTourGuides = async (req, res) => {
  try {
    const tourGuides = await TourGuide.find({});

    res.status(200).json({
      success: true,
      message: "Successful",
      data: tourGuides,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found",
    });
  }
};