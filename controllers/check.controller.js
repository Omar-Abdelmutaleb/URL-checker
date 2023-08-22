import Check from "../models/check.model.js";
import { createError } from "../utils/createError.js";

export const createCheck = async (req, res, next) => {
  const newCheck = new Check({
    userId: req.userId,
    ...req.body,
  });

  try {
    // console.log(newCheck._id.toString());
    // console.log( req.userId)
    // console.log( newCheck.userId)

    const savedCheck = await newCheck.save();
    res.status(200).json({
      status: "SUCCESS",
      message: "CHECK CREATED SUCCESSFULLY",
      data: savedCheck,
    });
  } catch (err) {
    next(err);
  }
};

export const getCheckByName = async (req, res) => {
  try {
    const check = await Check.findOne({ name: req.body.name });
    if (!check)
      return next(createError(404, "Check with this name is not found"));
    res.status(200).send(check);
  } catch (err) {
    next(err);
  }
};

export const deleteCheckById = async (req, res, next) => {
  try {
    const check = await Check.findById(req.params.id);
    if (check.userId !== req.userId) {
      return next(createError(403, "YOU CAN ONLY DELETE YOUR OWN CHECKS"));
    }
    await Check.findByIdAndDelete(req.params.id);
    res.status(200).send("CHECK HAS BEEN DELETED SUCCESSFULLY");
  } catch (err) {
    next(err);
  }
};

export const updateCheckById = async (req, res, next) => {
  try {
    const check = await Check.findById(req.params.id);
    console.log(check.userId);
    console.log(req.userId, "SS");
    if (check.userId !== req.userId)
      return next(createError(403, "YOU CAN ONLY EDIT YOUR OWN CHECKS"));

    await Check.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: req.body.name,
          url: req.body.url,
          protocol: req.body.protocol,
        },
      },
      { new: true }
    );
    res.status(200).send("CHECK HAS BEEN UPDATED SUCCESSFULLY");
  } catch (err) {
    next(err);
  }
};
