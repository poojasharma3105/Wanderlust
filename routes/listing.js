const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require ("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");

const listingController = require("../controllers/listings.js");
const multer = require("multer");
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });

router.route("/")
   //index route
  .get(wrapAsync(listingController.index))
  //Create Route
  .post(
    isLoggedIn, 
    upload.single("listing[image]"), //multer processing
    validateListing, 
    wrapAsync( listingController.createListing)
  );

//New route
router.get("/new", isLoggedIn, listingController.renderNewForm);

//search route
router.get('/search', wrapAsync(listingController.searchListing));

// Route to filter listings by selected categories
router.get('/filter', wrapAsync(listingController.filterListing));

router.route("/:id")
  //show route
  .get(wrapAsync(listingController.showListing))
  //update route
  .put(
    isLoggedIn, 
    isOwner, 
    upload.single("listing[image]"), //multer processing
    validateListing, 
    wrapAsync(listingController.updateListing)
  )
  //delete route
  .delete(
    isLoggedIn, 
    isOwner, 
    wrapAsync(listingController.deleteListing)
  );

//Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync( listingController.renderEditForm));


module.exports = router;