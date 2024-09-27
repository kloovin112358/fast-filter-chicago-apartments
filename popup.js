const element = document.querySelector("#neighborhood");
const choices = new Choices(element);

function refreshNoNeighborhoodSearchText() {
  // this function is to set help text for users in the case that they selected Domu or Redfin
  // and also had a neighborhood selected
  // due to how searches are designed for these two platforms, it is not possible to
  // set neighborhood in the URL. So, the user should be warned that it will not work.
  const apartmentSiteField = document.getElementById("apartmentSite");
  const neighborhoodField = document.getElementById("neighborhood");
  const helpText = document.getElementById("noNeighborhoodSearchHelpText");
  if (
    apartmentSiteField.value !== "" &&
    neighborhoodField.value !== "" &&
    (apartmentSiteField.value === "www.redfin.com" ||
      apartmentSiteField.value === "www.domu.com")
  ) {
    console.log("boop");
    if (helpText.classList.contains("d-none")) {
      helpText.classList.remove("d-none");
    }
  } else {
    if (!helpText.classList.contains("d-none")) {
      helpText.classList.add("d-none");
    }
  }
}

document.getElementById("applyFilters").addEventListener("click", (event) => {
  event.preventDefault(); // Prevent the form from submitting

  const apartmentSiteField = document.getElementById("apartmentSite");
  const apartmentType = document.getElementById("apartmentType").value;
  const maxPrice = document.getElementById("maxPrice").value;
  const neighborhood = document.getElementById("neighborhood").value;

  // Check if apartmentSite value is present
  if (apartmentSiteField.value === "") {
    // If empty, add Bootstrap validation classes
    apartmentSiteField.classList.add("is-invalid");
  } else {
    // If valid, proceed with sending the message
    apartmentSiteField.classList.remove("is-invalid");

    // Assuming the domain is not required from tabs, just use form data directly
    const formData = {
      apartmentSite: apartmentSiteField.value,
      apartmentType: apartmentType,
      maxPrice: maxPrice,
      neighborhood: neighborhood,
    };

    // Send message to content script or handle further processing
    chrome.runtime.sendMessage(
      {
        message: "fastFilter",
        formData: formData,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error:", chrome.runtime.lastError.message);
          document.getElementById("statusResult").textContent =
            chrome.runtime.lastError.message;
          document.getElementById("statusResult").classList.add("text-danger");
        } else {
          if (response.url) {
            // Open a new tab with the URL
            chrome.tabs.create({ url: response.url });
          }
          document.getElementById("statusResult").textContent =
            response.statusMessage;
        }
      }
    );
  }
});

document
  .getElementById("resetFiltersBtn")
  .addEventListener("click", (event) => {
    event.preventDefault(); // Prevent the form from submitting
    document.getElementById("apartmentSite").value = "";
    document.getElementById("apartmentType").value = "";
    document.getElementById("maxPrice").value = "";
    document.getElementById("neighborhood").value = "";
    choices.setChoiceByValue("");
    document.getElementById("apartmentSite").classList.remove("is-invalid");
    saveFormData();
  });

document
  .getElementById("saveCurrentSearch")
  .addEventListener("click", (event) => {
    event.preventDefault(); // Prevent the form from submitting

    // Get the current tab's URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const currentUrl = tabs[0].url; // Get the URL of the active tab

        // Retrieve existing saved searches
        chrome.storage.local.get("savedSearches", (result) => {
          const savedSearches = result.savedSearches || []; // Initialize if not present

          // Add the current URL to the saved searches
          savedSearches.push({
            label: new URL(currentUrl).hostname.replace(/^www\./, ""),
            url: currentUrl,
          });

          // Save the updated array back to chrome storage
          chrome.storage.local.set({ savedSearches: savedSearches }, () => {
            loadSavedSearches(savedSearches);
            const saveButton = document.getElementById("saveCurrentSearch");
            const tooltip = new bootstrap.Tooltip(saveButton, {
              title: "Saved!",
              placement: "top",
              trigger: "manual", // Manually trigger
            });

            tooltip.show(); // Show the tooltip

            // Hide the tooltip after a short duration
            setTimeout(() => {
              tooltip.hide();
            }, 2000); // Hide after 2 seconds
          });
        });
      }
    });
  });

function saveFormData() {
  const formData = {
    apartmentSite: document.getElementById("apartmentSite").value,
    apartmentType: document.getElementById("apartmentType").value,
    maxPrice: document.getElementById("maxPrice").value,
    neighborhood: document.getElementById("neighborhood").value,
  };

  // Store in localStorage under defaultFormData
  chrome.storage.local.set({ defaultFormData: formData });
}

function addFormFieldListeners() {
  const apartmentSiteField = document.getElementById("apartmentSite");
  const apartmentTypeField = document.getElementById("apartmentType");
  const maxPriceField = document.getElementById("maxPrice");
  const neighborhoodField = document.getElementById("neighborhood");

  // Event listener for the apartment site select
  apartmentSiteField.addEventListener("change", () => {
    saveFormData();
    refreshNoNeighborhoodSearchText();
  });

  // Event listener for apartment type input
  apartmentTypeField.addEventListener("blur", () => {
    saveFormData();
  });

  // Event listener for max price input
  maxPriceField.addEventListener("blur", () => {
    saveFormData();
  });

  // Event listener for neighborhood select
  neighborhoodField.addEventListener("change", () => {
    saveFormData();
    refreshNoNeighborhoodSearchText();
  });
}

// Step 1: Initialize tabs and listen for tab clicks
const triggerTabList = document.querySelectorAll("#myTab button");
triggerTabList.forEach((triggerEl) => {
  const tabTrigger = new bootstrap.Tab(triggerEl);

  triggerEl.addEventListener("click", (event) => {
    event.preventDefault();
    tabTrigger.show();

    const tabId = triggerEl.getAttribute("id");

    // Save the clicked tab ID in chrome storage
    chrome.storage.local.set({ openOnStartup: tabId });
  });
});

function loadSavedSearches(savedSearches) {
  const savedSearchesListGroup = document.getElementById(
    "savedSearchesListGroup"
  );

  // Clear the existing list
  savedSearchesListGroup.innerHTML = "";
  if (savedSearches && savedSearches.length !== 0) {
    // Populate the list with saved searches
    savedSearches.forEach((savedSearchesDict) => {
      // Create a new list item
      const listItem = document.createElement("li");
      listItem.className =
        "list-group-item d-flex justify-content-between align-items-center";

      // Create the link
      const searchLabel = savedSearchesDict.label; // Extract the domain from the URL
      const link = document.createElement("a");
      link.href = savedSearchesDict.url;
      link.target = "_blank"; // Open in a new tab
      link.className = "text-decoration-none";
      link.textContent = searchLabel; // Set the text to the domain

      const actionDiv = document.createElement("div");
      actionDiv.className = "action-container";

      const editButton = document.createElement("button");
      editButton.className = "btn btn-link editSaved";
      editButton.setAttribute("aria-label", "Edit saved item");
      editButton.innerHTML =
        '<i class="bi bi-pencil-square" aria-hidden="true"></i>'; // Add the pencil icon

      // Create the remove button
      const removeButton = document.createElement("button");
      removeButton.className = "btn btn-outline-danger btn-sm remove";
      removeButton.setAttribute("aria-label", "Remove saved item");
      removeButton.innerHTML = '<i class="bi bi-trash" aria-hidden="true"></i>'; // Add the trash icon

      actionDiv.appendChild(editButton);
      actionDiv.appendChild(removeButton);

      // Append the link and button to the list item
      listItem.appendChild(link);
      listItem.appendChild(actionDiv);

      // Append the list item to the list group
      savedSearchesListGroup.appendChild(listItem);

      // Add an event listener for the remove button
      removeButton.addEventListener("click", () => {
        const index = savedSearches.indexOf(savedSearchesDict);
        if (index > -1) {
          savedSearches.splice(index, 1); // Remove the URL from the array
          chrome.storage.local.set({ savedSearches: savedSearches }, () => {
            loadSavedSearches(savedSearches); // Reload the saved searches
          });
        }
      });
    });
  } else {
    savedSearchesListGroup.innerHTML =
      "Your saved searches or units will appear here.";
  }
}

document
  .getElementById("savedSearchesListGroup")
  .addEventListener("click", (event) => {
    // Check if the clicked element or its closest parent has the class .editSaved
    const editButton = event.target.closest(".editSaved");
    if (editButton) {
      // Find the corresponding <li> element
      const listItem = editButton.closest("li");

      // Find the <a> element inside the list item
      const linkElement = listItem.querySelector("a.text-decoration-none");

      if (linkElement) {
        // Get the current href and text content of the <a>
        const currentHref = linkElement.href;
        const currentText = linkElement.textContent;

        // Create the new input element
        const inputField = document.createElement("input");
        inputField.className = "form-control";
        inputField.type = "text";
        inputField.value = currentText; // Set the value as the current text
        inputField.setAttribute("data-href", currentHref); // Store href in data attribute
        inputField.setAttribute("data-old-label", currentText);

        // Replace the <a> element with the input field
        listItem.replaceChild(inputField, linkElement);

        // Focus the input field for immediate editing
        inputField.focus();

        inputField.addEventListener("blur", handleInputSave);
        inputField.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === "Tab") {
            handleInputSave();
          }
        });

        function handleInputSave() {
          const newText = inputField.value; // Get the updated value from the input

          // Create a new <a> element to replace the input
          const newLinkElement = document.createElement("a");
          newLinkElement.href = inputField.getAttribute("data-href"); // Use the stored href
          newLinkElement.target = "_blank";
          newLinkElement.className = "text-decoration-none";
          newLinkElement.textContent = newText; // Set the new text as the link content

          // if new text is different, we need to save that to memory
          const oldText = inputField.getAttribute("data-old-label");
          if (oldText !== newText) {
            chrome.storage.local.get("savedSearches", (result) => {
              const savedSearches = result.savedSearches || []; // Initialize if not present
              const currentUrl = inputField.getAttribute("data-href");

              // Find the search entry with the matching URL
              const searchEntryIndex = savedSearches.findIndex(
                (item) => item.url === currentUrl
              );

              if (searchEntryIndex !== -1) {
                // Update the label for the corresponding URL
                savedSearches[searchEntryIndex].label = newText;

                // Save the updated array back to chrome storage
                chrome.storage.local.set({ savedSearches: savedSearches });
              }
            });
          }

          // Replace the input field with the new <a> element
          listItem.replaceChild(newLinkElement, inputField);
        }
      }
    }
  });

// Step 2: Function to initialize the widget on page load
function initializeWidget() {
  // Get the 'openOnStartup' value from chrome storage
  chrome.storage.local.get(
    ["openOnStartup", "defaultFormData", "savedSearches"],
    function (result) {
      const savedTabId = result.openOnStartup;
      const defaultFormData = result.defaultFormData;
      const savedSearches = result.savedSearches;

      // Set the saved tab
      if (savedTabId) {
        // Find the tab button using the saved ID
        const triggerEl = document.querySelector(`#myTab button#${savedTabId}`);
        if (triggerEl) {
          const tabInstance = new bootstrap.Tab(triggerEl);
          tabInstance.show(); // Activate the saved tab on startup
        }
      } else {
        // Optionally: Open the first tab if no saved tab is found
        const triggerFirstTabEl = document.querySelector(
          "#myTab li:first-child button"
        );
        if (triggerFirstTabEl) {
          bootstrap.Tab.getInstance(triggerFirstTabEl).show();
        }
      }

      if (defaultFormData) {
        const data = defaultFormData;
        document.getElementById("apartmentSite").value =
          data.apartmentSite || "";
        document.getElementById("apartmentType").value =
          data.apartmentType || "";
        document.getElementById("maxPrice").value = data.maxPrice || "";
        document.getElementById("neighborhood").value = data.neighborhood || "";
        choices.setChoiceByValue(data.neighborhood || "");
        refreshNoNeighborhoodSearchText();
      }
      loadSavedSearches(savedSearches);
    }
  );
}

document.addEventListener("DOMContentLoaded", () => {
  addFormFieldListeners();
  // Initialize the widget
  initializeWidget();
});
