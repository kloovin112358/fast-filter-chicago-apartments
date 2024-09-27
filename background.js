function stringToNumBedsHelper(bedString) {
  let bed = null;
  if (bedString == "studio") {
    bed = 0;
  } else if (bedString == "1-bedroom") {
    bed = 1;
  } else if (bedString == "2-bedroom") {
    bed = 2;
  } else if (bedString == "3-bedroom") {
    bed = 3;
  } else if (bedString == "4-bedroom") {
    bed = 4;
  }
  return bed;
}

function lakeViewHelper(neighborhood) {
  // for certain neighborhoods, map databases don't recognize a search term, and it has to be converted to another
  // example: for Apartments.com and Domu, Lake View isn't recognized - it's Lake View East or West Lake View.
  if (neighborhood == "lake-view") {
    return "lake-view-east";
  }
  return neighborhood;
}

function ApartmentGuideRentDotComMaxPriceRounding(maxPrice) {
  // this is for a weird case - Apartment Guide and Rent.com hardcode certain intervals
  // of max price, like $2,100, $2,300, $2,500, $3,000 for some reason
  // so this has to be converted
  if (maxPrice <= 300) {
    return 300;
  } else if (maxPrice <= 2100) {
    // If maxPrice is less than or equal to 2100, round to the nearest 100
    return Math.round(maxPrice / 100) * 100;
  } else if (maxPrice <= 2500) {
    // If maxPrice is between 2100 and 2500, round to the nearest 200
    return Math.round((maxPrice - 2100) / 200) * 200 + 2100;
  } else if (maxPrice <= 7000) {
    // If maxPrice is between 3000 and 7000, round to the nearest 1000
    return Math.round(maxPrice / 1000) * 1000;
  } else if (maxPrice <= 11000) {
    // If maxPrice is between 9000 and 11000, round to the nearest 2000
    return Math.round(maxPrice / 2000) * 2000;
  } else {
    // Beyond 11000, return the maximum interval value (11000)
    return 11000;
  }
}

function buildForRentURL(formData) {
  let url = "https://www.forrent.com/find/IL/metro-Chicago/Chicago/";
  if (formData.maxPrice) {
    url = url + `price-Less+than+${formData.maxPrice}/`;
  }
  if (formData.apartmentType) {
    if (formData.apartmentType === "studio") {
      url = url + "beds-studio/";
    } else if (formData.apartmentType === "4-bedroom") {
      url = url + "beds-4+and+up/";
    } else {
      url = url + `beds-${stringToNumBedsHelper(formData.apartmentType)}/`;
    }
  }
  if (formData.neighborhood) {
    let neighborhoodStr = lakeViewHelper(formData.neighborhood);
    neighborhoodStr = neighborhoodStr.replace(/-/g, "+");
    url = url + "neighborhoods-" + neighborhoodStr;
  }
  return url;
}

function buildRealtorDotComURL(formData) {
  let url = "https://www.realtor.com/apartments/";
  let locationPart = "Chicago_IL/";
  if (formData.neighborhood) {
    locationPart = formData.neighborhood + "_" + locationPart;
  }
  url = url + locationPart;

  let bedsPart = "";
  if (formData.apartmentType) {
    if (formData.apartmentType === "studio") {
      bedsPart = "beds-studio/";
    } else {
      let numBeds = stringToNumBedsHelper(formData.apartmentType);
      bedsPart = `beds-${numBeds}-${numBeds}/`;
    }
  }
  url = url + bedsPart;

  if (formData.maxPrice) {
    url = url + `price-na-${formData.maxPrice}/`;
  }
  return url;
}

function buildRedfinURL(formData) {
  let url =
    "https://www.redfin.com/city/29470/IL/Chicago/apartments-for-rent/filter/property-type=multifamily";
  if (formData.apartmentType) {
    let numBeds = stringToNumBedsHelper(formData.apartmentType);
    url = url + `,min-beds=${numBeds},max-beds=${numBeds}`;
  }
  if (formData.maxPrice) {
    url = url + `,max-price=${formData.maxPrice}`;
  }
  return url;
}

// function buildZumperURL(formData) {
//   // NOTE: THIS EXTENSION DOES NOT SUPPORT NEIGHBORHOOD SEARCHES FOR ZUMPER DUE TO THEIR WEIRD SEARCH LOGIC
//   // basically when you search Wrigleyville, it redirects to Lakeview. Lake view redirects to Lincoln Park...
//   let url = "https://www.zumper.com/apartments-for-rent/chicago-il/";
//   let aptTypeStr = "";
//   if (formData.apartmentType) {
//     if (formData.apartmentType === "studio") {
//       aptTypeStr = "studios/";
//     } else if (formData.apartmentType === "4-bedroom") {
//       aptTypeStr = "4+beds/";
//     } else {
//       aptTypeStr = `${stringToNumBedsHelper(formData.apartmentType)}-beds/`;
//     }
//   }
//   url = url + aptTypeStr;
//   if (formData.maxPrice) {
//     url = url + "under-" + Math.round(formData.maxPrice / 50) * 50;
//   }
//   return url;
// }

function buildApartmentGuideURL(formData) {
  // Base URL for the city
  let url = "https://www.apartmentguide.com/";
  let endTag = "";

  // If a neighborhood is provided, modify the URL accordingly
  if (formData.neighborhood) {
    url =
      url +
      "neighborhoods/apartments/Illinois/Chicago/" +
      formData.neighborhood +
      "/";
  } else {
    url = url + "apartments/Illinois/Chicago/";
  }

  if (formData.apartmentType) {
    endTag = stringToNumBedsHelper(formData.apartmentType) + "-beds";
  }

  if (formData.maxPrice) {
    if (endTag !== "") {
      endTag = endTag + "-";
    }
    endTag =
      endTag +
      "under-" +
      ApartmentGuideRentDotComMaxPriceRounding(formData.maxPrice);
  }

  url = url + endTag;

  return url;
}

function buildApartmentFinderURL(formData) {
  let url = "https://www.apartmentfinder.com/Illinois/";
  if (formData.neighborhood) {
    url = url + `Chicago/${formData.neighborhood}-Neighborhood-Apartments/`;
  } else {
    url = url + "Chicago-Apartments/";
  }
  if (formData.apartmentType) {
    url = url + formData.apartmentType;
    if (
      !(
        formData.apartmentType === "studio" ||
        formData.apartmentType === "1-bedroom"
      )
    ) {
      url = url + "s/";
    } else {
      url = url + "/";
    }
  }
  if (formData.maxPrice) {
    url = url + `q/?xr=${formData.maxPrice}`;
  }
  return url;
}

function buildTruliaURL(formData) {
  let baseUrl = "https://www.trulia.com/for_rent/Chicago";
  let neighborhoodString = "";
  let priceString = "";
  let bedsString = "";

  // Format neighborhood if provided
  if (formData.neighborhood) {
    neighborhoodString = `,${formData.neighborhood.replace(/-/g, "_")},IL`;
  } else {
    neighborhoodString = ",IL"; // Default state is Illinois
  }

  // Set max price if provided
  if (formData.maxPrice) {
    priceString = `/0-${formData.maxPrice}_price`;
  }

  // Set number of bedrooms if provided
  if (formData.apartmentType) {
    const numBeds = stringToNumBedsHelper(formData.apartmentType);
    if (numBeds !== null) {
      bedsString = `/${numBeds}_beds`;
    }
  }

  // Build the final URL
  const url = baseUrl + neighborhoodString + bedsString + priceString;

  return url;
}

function buildCompassURL(formData) {
  let baseUrl = "https://www.compass.com/for-rent/";
  let neighborhoodString = "chicago-il/";
  let priceString = "";
  let bedsString = "";

  // Format neighborhood if provided
  if (formData.neighborhood) {
    neighborhoodString = formData.neighborhood + "-" + neighborhoodString;
  }

  // Set price if provided
  if (formData.maxPrice) {
    let price =
      formData.maxPrice >= 1000
        ? formData.maxPrice / 1000 + "K"
        : formData.maxPrice;
    priceString = `price.max=${price}/`;
  }

  // Set number of bedrooms if provided
  if (formData.apartmentType) {
    const numBeds = stringToNumBedsHelper(formData.apartmentType);
    if (numBeds !== null) {
      if (numBeds == 0) {
        bedsString = `beds=0-0.5/`;
      } else {
        bedsString = `beds=${numBeds}-${numBeds}/`;
      }
    }
  }

  // Build the final URL
  const url = baseUrl + neighborhoodString + priceString + bedsString;

  return url;
}

function buildCraigslistURL(formData) {
  let neighborhoodString = "";
  let beds = "";
  let priceString = "";

  // Format neighborhood if provided
  if (formData.neighborhood) {
    neighborhoodString = encodeURIComponent(
      formData.neighborhood.replace(/-/g, " ")
    );
  }

  // Set number of bedrooms if provided
  if (formData.apartmentType) {
    const numBeds = stringToNumBedsHelper(formData.apartmentType);
    if (numBeds !== null) {
      beds = `min_bedrooms=${numBeds}&max_bedrooms=${numBeds}`;
    }
  }

  // Set price if provided
  if (formData.maxPrice) {
    priceString = `max_price=${formData.maxPrice}`;
  }

  // Build the URL
  const url =
    `https://chicago.craigslist.org/search/apa?` +
    (beds ? `${beds}&` : "") +
    (priceString ? `${priceString}&` : "") +
    (neighborhoodString ? `query=${neighborhoodString}` : "");

  return url;
}

function buildHotPadsURL(formData) {
  let neighborhoodString = "";
  let apartmentTypeString = "apartments-for-rent";
  let priceString = "";

  // Format neighborhood if provided
  if (formData.neighborhood) {
    neighborhoodString = formData.neighborhood;
  }

  // Set apartment type if provided
  if (formData.apartmentType) {
    if (formData.apartmentType == "4-bedroom") {
      apartmentTypeString = apartmentTypeString + "?beds=4";
    } else {
      apartmentTypeString = formData.apartmentType + "-" + apartmentTypeString;
    }
  }

  // Set price range if provided
  if (formData.maxPrice) {
    priceString = `?price=0-${formData.maxPrice}`;
  }

  // Build the URL
  const url =
    `https://hotpads.com/` +
    (neighborhoodString ? `${neighborhoodString}-chicago-il/` : `chicago-il/`) +
    `${apartmentTypeString}` +
    `${priceString}`;

  return url;
}

function buildRentDotComURL(formData) {
  let neighborhoodString = "";
  let apartmentTypeString = "";
  let maxPriceString = "";

  // Format neighborhood if provided
  if (formData.neighborhood) {
    neighborhoodString = formData.neighborhood + "-neighborhood";
  }

  // Set apartment type if provided
  if (formData.apartmentType) {
    apartmentTypeString = formData.apartmentType;
  }

  // Set max price if provided
  if (formData.maxPrice) {
    maxPriceString = `max-price-${ApartmentGuideRentDotComMaxPriceRounding(
      formData.maxPrice
    )}`;
  }

  // Build the final URL
  const url =
    `https://www.rent.com/illinois/chicago/` +
    (neighborhoodString ? `${neighborhoodString}/` : "") +
    `apartments_townhouses_condos_houses` +
    (apartmentTypeString ? `_${apartmentTypeString}` : "") +
    (maxPriceString ? `_${maxPriceString}` : "");

  return url;
}

function buildDomuURL(formData) {
  // let neighborhoodString = "";
  let beds = "";
  // if (formData.neighborhood) {
  //   // Replace dashes with spaces
  //   let neighborhoodFormStr = formData.neighborhood.replace(/-/g, " ");
  //   // Append city and state
  //   neighborhoodString = encodeURIComponent(
  //     neighborhoodFormStr + ", Chicago, IL, USA"
  //   );
  // }
  if (formData.apartmentType) {
    beds = stringToNumBedsHelper(formData.apartmentType);
  }
  // Build the URL
  const url =
    `https://www.domu.com/chicago-il/apartments?` +
    // `&domu_search=${neighborhoodString}` +
    `&domu_bedrooms_min=${beds}` +
    `&domu_bedrooms_max=${beds}` +
    `&domu_rentalprice_min=` +
    `&domu_rentalprice_max=${formData.maxPrice}`;

  return url;
}

function buildZillowURL(formData) {
  // Base Zillow URL with a placeholder for neighborhood
  let baseURL = "https://www.zillow.com/";

  // Set default neighborhood string
  let neighborhoodString = "chicago-il/rentals/";

  // Include neighborhood if provided
  if (formData.neighborhood !== "") {
    neighborhoodString = formData.neighborhood + "-chicago-il/rentals/";
  }

  // Initialize filter state object
  let filterState = {
    filterState: {
      fr: {
        value: true,
      },
      fsba: {
        value: false,
      },
      fsbo: {
        value: false,
      },
      nc: {
        value: false,
      },
      cmsn: {
        value: false,
      },
      auc: {
        value: false,
      },
      fore: {
        value: false,
      },
    },
    isMapVisible: true,
    mapZoom: 16,
    isListVisible: true,
  };

  // Handle max price if provided
  if (formData.maxPrice !== "") {
    filterState.filterState.mp = { max: parseInt(formData.maxPrice) };
    filterState.filterState.price = { max: 513683 };
  }

  // Handle min and max beds if provided
  if (formData.apartmentType !== "") {
    let bed = stringToNumBedsHelper(formData.apartmentType);

    let bedSection = {
      max: bed,
      min: bed,
    };
    filterState.filterState.beds = bedSection;
  }

  // Add other filters if needed (you can extend this part based on formData)
  // Convert filterState object to JSON and encode it for URL
  let encodedFilterState = encodeURIComponent(JSON.stringify(filterState));

  // Construct and return the final Zillow URL
  return `${baseURL}${neighborhoodString}?searchQueryState=${encodedFilterState}`;
}

function buildApartmentsDotComURL(formData) {
  // Default neighborhood string
  let neighborhoodString = "chicago-il";

  // Include neighborhood if provided
  if (formData.neighborhood !== "") {
    neighborhoodString =
      lakeViewHelper(formData.neighborhood) + "-" + neighborhoodString;
  }

  // Initialize apartment type and price string
  let apartmentTypePriceString = "";

  // Handle apartment type if provided
  if (formData.apartmentType !== "") {
    apartmentTypePriceString = "/" + formData.apartmentType + "s";
  }

  // Handle max price if provided
  if (formData.maxPrice !== "") {
    // Adjust for different scenarios based on the presence of apartment type
    if (apartmentTypePriceString !== "") {
      apartmentTypePriceString += "-under-" + formData.maxPrice;
    } else {
      apartmentTypePriceString = "/under-" + formData.maxPrice;
    }
  }

  // Construct the final URL
  return `https://www.apartments.com/${neighborhoodString}${apartmentTypePriceString}/`;
}

function filterMain(formData) {
  let returnURL = null;

  switch (formData.apartmentSite) {
    case "www.apartments.com":
      returnURL = buildApartmentsDotComURL(formData);
      break;
    case "www.zillow.com":
      returnURL = buildZillowURL(formData);
      break;
    case "www.domu.com":
      returnURL = buildDomuURL(formData);
      break;
    case "www.rent.com":
      returnURL = buildRentDotComURL(formData);
      break;
    case "www.hotpads.com":
      returnURL = buildHotPadsURL(formData);
      break;
    case "www.chicago.craigslist.org":
      returnURL = buildCraigslistURL(formData);
      break;
    case "www.compass.com":
      returnURL = buildCompassURL(formData);
      break;
    case "www.trulia.com":
      returnURL = buildTruliaURL(formData);
      break;
    case "www.apartmentfinder.com":
      returnURL = buildApartmentFinderURL(formData);
      break;
    case "www.apartmentguide.com":
      returnURL = buildApartmentGuideURL(formData);
      break;
    case "www.redfin.com":
      returnURL = buildRedfinURL(formData);
      break;
    case "www.realtor.com":
      returnURL = buildRealtorDotComURL(formData);
      break;
    case "www.forrent.com":
      returnURL = buildForRentURL(formData);
      break;
    default:
      break;
  }

  if (!returnURL) {
    // Return an error message if no URL was generated
    return { error: "Could not generate a valid URL for the selected site." };
  } else {
    return { url: returnURL, error: null };
  }
}

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "fastFilter") {
    const { url, error } = filterMain(request.formData);
    if (error) {
      sendResponse({ statusMessage: error });
    } else {
      sendResponse({ statusMessage: "URL generated successfully.", url: url });
    }
  }
});
