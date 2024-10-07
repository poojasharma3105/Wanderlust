const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", {allListings, q: undefined});
};

module.exports.renderNewForm = (req,res) =>{
    // console.log(req.user);
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) =>{
    let { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({ 
          path: "reviews", 
          populate: {
            path: "author",
          }, 
       }).populate("owner").exec();
    if(!listing){
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }else{
        res.render("listings/show.ejs", { listing });
    }
};

module.exports.createListing =async (req,res, next) =>{
    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
      })
      .send();

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url, filename};
    // Handle categories properly as an array (in case none is selected)
    if (!Array.isArray(req.body.listing.categories)) {
        req.body.listing.categories = req.body.listing.categories ? [req.body.listing.categories] : [];
    }

    // Set categories (ensure req.body.listing.categories is an array or single category string)
    newListing.categories = Array.isArray(req.body.listing.categories) 
        ? req.body.listing.categories 
        : [req.body.listing.categories];
    
    // newListing.geometry = response.body.features[0].geometry;
    if (response.body.features.length > 0) {
        newListing.geometry = response.body.features[0].geometry; // Set geometry from geocode response
    } else {
        // Handle case where no results were found
        req.flash("error", "Location not found. Listing not created.");
        return res.redirect("/listings/new");
    }

    let savedListing = await newListing.save();
    console.log(savedListing);
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req,res) =>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }else{
        let originalImageUrl = listing.image.url;
        originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
        res.render("listings/edit.ejs", {listing, originalImageUrl});
    }
};

module.exports.updateListing = async(req, res) =>{
    let {id} = req.params;
    if (!Array.isArray(req.body.listing.categories)) {
        req.body.listing.categories = req.body.listing.categories ? [req.body.listing.categories] : [];
    }
    let listing = await Listing.findByIdAndUpdate({_id  : id}, { ...req.body.listing });

    if(typeof req.file !== "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename};
        await listing.save();
    }
    
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res, next)=>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};

module.exports.searchListing  = async (req, res) => {
    const {q} = req.query;
    if (!q) {
      return res.redirect('/listings'); 
    }
    try {
        const listings = await Listing.find({
          $or: [
            { title: { $regex: q, $options: 'i' } }, 
            { description: { $regex: q, $options: 'i' } }, 
          ]
        });
        res.render('listings/search.ejs', { allListings: listings });
      } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
      }
    };

    module.exports.filterListing = async (req, res) => {
      const { categories } = req.query; // Get selected category from query
      let filterCriteria = {};
  
      // If categories are selected, filter by them
      if (categories) {
        const categoriesArray = Array.isArray(categories) ? categories : [categories];
          filterCriteria.categories = { $in: categories }; // Ensures it can filter by multiple categories
      }
  
      try {
          const filteredListings = await Listing.find(filterCriteria);
          res.render('listings/index.ejs', { allListings: filteredListings, q: undefined });
      } catch (err) {
          console.error(err);
          res.status(500).send('Server Error');
      }
  };
      