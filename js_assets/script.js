/* ============================================================
   MolifiStudioz Sound Management - Website JavaScript
   ------------------------------------------------------------
   This script powers every page of the MolifiStudioz website:
   1. Mobile navigation menu (hamburger toggle)
   2. Highlighting the active page in the navigation bar
   3. Enquiry form validation + booking summary (enquiries.html)
   4. Contact form validation (contacts.html)
   5. Automatic footer with the current year
   ============================================================ */


/* ------------------------------------------------------------
   PURE HELPER FUNCTIONS
   (These contain no page code, so they are easy to test.)
   ------------------------------------------------------------ */

// Check that an email address looks valid, e.g. name@example.co.za
function isValidEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return pattern.test(String(email).trim());
}

// Check a South African phone number.
// Accepts formats like: 0696359389, +27 69 635 9389, 069 635 9389
function isValidSAPhone(phone) {
  const digits = String(phone).replace(/[\s\-()+]/g, "");
  // Local format: 0 followed by 9 digits  (e.g. 0696359389)
  // International format: 27 followed by 9 digits (e.g. 27696359389)
  return /^0\d{9}$/.test(digits) || /^27\d{9}$/.test(digits);
}

// Check that a chosen event date is today or in the future.
function isDateInFuture(dateString) {
  if (!dateString) return true; // the date field is optional
  const chosen = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return chosen >= today;
}

// Format a date string (yyyy-mm-dd) nicely, e.g. "15 November 2026".
function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}


/* ------------------------------------------------------------
   Everything below runs in the browser only.
   ------------------------------------------------------------ */
if (typeof document !== "undefined") {

  document.addEventListener("DOMContentLoaded", function () {

    /* --------------------------------------------------------
       1. MOBILE NAVIGATION (hamburger menu)
       The button is created by JavaScript and placed inside
       the empty .nav-right div, so the HTML stays clean.
       -------------------------------------------------------- */
    const navLinks = document.getElementById("nav-links");
    const navRight = document.querySelector(".nav-right");

    if (navLinks && navRight) {
      const toggleButton = document.createElement("button");
      toggleButton.className = "nav-toggle";
      toggleButton.type = "button";
      toggleButton.innerHTML = "&#9776;"; // hamburger icon
      toggleButton.setAttribute("aria-label", "Open navigation menu");
      toggleButton.setAttribute("aria-expanded", "false");

      toggleButton.addEventListener("click", function () {
        const isOpen = navLinks.classList.toggle("nav-open");
        toggleButton.setAttribute("aria-expanded", String(isOpen));
        toggleButton.innerHTML = isOpen ? "&times;" : "&#9776;";
        toggleButton.setAttribute(
          "aria-label",
          isOpen ? "Close navigation menu" : "Open navigation menu"
        );
      });

      navRight.appendChild(toggleButton);

      // Close the menu after the visitor clicks a link (mobile).
      navLinks.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          navLinks.classList.remove("nav-open");
          toggleButton.innerHTML = "&#9776;";
          toggleButton.setAttribute("aria-expanded", "false");
        });
      });
    }

    /* --------------------------------------------------------
       2. HIGHLIGHT THE ACTIVE PAGE IN THE NAVBAR
       Compares each link's file name with the current page.
       -------------------------------------------------------- */
    if (navLinks) {
      const currentPage =
        window.location.pathname.split("/").pop() || "index.html";

      navLinks.querySelectorAll("a").forEach(function (link) {
        if (link.getAttribute("href") === currentPage) {
          link.classList.add("active");
        }
      });
    }

    /* --------------------------------------------------------
       3. SMALL FORM HELPERS (shared by both forms)
       -------------------------------------------------------- */

    // Show a red error message directly underneath a field.
    function showError(field, message) {
      clearError(field);
      field.classList.add("field-invalid");
      const error = document.createElement("span");
      error.className = "form-error";
      error.textContent = message;
      field.insertAdjacentElement("afterend", error);
    }

    // Remove the error message from a field.
    function clearError(field) {
      field.classList.remove("field-invalid");
      const next = field.nextElementSibling;
      if (next && next.classList.contains("form-error")) {
        next.remove();
      }
    }

    // Show a green confirmation box above the form.
    function showSuccess(form, htmlMessage) {
      const oldBox = form.querySelector(".form-success");
      if (oldBox) oldBox.remove();

      const box = document.createElement("div");
      box.className = "form-success";
      box.innerHTML = htmlMessage;
      form.insertAdjacentElement("afterbegin", box);
      box.scrollIntoView({ behavior: "smooth", block: "center" });
    }


    /* --------------------------------------------------------
       4. ENQUIRY FORM (enquiries.html)
       Validates every field and then shows the visitor a
       summary of their enquiry. The enquiry is also saved in
       the browser (localStorage) so it is not lost.
       -------------------------------------------------------- */
    const enquiryForm = document.querySelector('form:has(#enquiryType)');

    if (enquiryForm) {
      const nameField = document.getElementById("name");
      const emailField = document.getElementById("email");
      const phoneField = document.getElementById("phone");
      const typeField = document.getElementById("enquiryType");
      const dateField = document.getElementById("eventDate");
      const guestsField = document.getElementById("guests");
      const venueField = document.getElementById("venue");
      const messageField = document.getElementById("message");

      // The event date must not be in the past: set the picker minimum.
      dateField.min = new Date().toISOString().split("T")[0];

      // Clear each field's error as soon as the visitor starts typing.
      enquiryForm.querySelectorAll("input, select, textarea").forEach(function (field) {
        field.addEventListener("input", function () {
          clearError(field);
        });
      });

      enquiryForm.addEventListener("submit", function (event) {
        event.preventDefault(); // stop the form until it is valid
        let firstInvalidField = null;

        // --- Full Name (at least 2 characters) ---
        if (nameField.value.trim().length < 2) {
          showError(nameField, "Please enter your full name.");
          firstInvalidField = firstInvalidField || nameField;
        }

        // --- Email Address ---
        if (!isValidEmail(emailField.value)) {
          showError(emailField, "Please enter a valid email address, e.g. you@example.com.");
          firstInvalidField = firstInvalidField || emailField;
        }

        // --- Phone Number (South African format) ---
        if (!isValidSAPhone(phoneField.value)) {
          showError(phoneField, "Please enter a valid SA phone number, e.g. 069 635 9389.");
          firstInvalidField = firstInvalidField || phoneField;
        }

        // --- Enquiry Type ---
        if (!typeField.value) {
          showError(typeField, "Please choose the type of enquiry.");
          firstInvalidField = firstInvalidField || typeField;
        }

        // --- Event Date (optional, but not in the past) ---
        if (!isDateInFuture(dateField.value)) {
          showError(dateField, "The event date cannot be in the past.");
          firstInvalidField = firstInvalidField || dateField;
        }

        // --- Guests (optional, but at least 1) ---
        if (guestsField.value && Number(guestsField.value) < 1) {
          showError(guestsField, "The number of guests must be at least 1.");
          firstInvalidField = firstInvalidField || guestsField;
        }

        // --- Message (at least 10 characters) ---
        if (messageField.value.trim().length < 10) {
          showError(messageField, "Please tell us a little more about your requirements (at least 10 characters).");
          firstInvalidField = firstInvalidField || messageField;
        }

        // If anything is wrong, jump to the first problem field.
        if (firstInvalidField) {
          firstInvalidField.focus();
          return;
        }

        // --- Everything is valid: build the enquiry object ---
        const enquiry = {
          name: nameField.value.trim(),
          email: emailField.value.trim(),
          phone: phoneField.value.trim(),
          enquiryType: typeField.value,
          eventDate: dateField.value || "Not specified",
          guests: guestsField.value || "Not specified",
          venue: venueField.value.trim() || "Not specified",
          message: messageField.value.trim(),
          submittedAt: new Date().toISOString()
        };

        // Save the enquiry in the browser so it is not lost.
        const saved = JSON.parse(localStorage.getItem("molifiEnquiries") || "[]");
        saved.push(enquiry);
        localStorage.setItem("molifiEnquiries", JSON.stringify(saved));

        // Show a friendly summary to the visitor.
        showSuccess(enquiryForm,
          "<strong>Thank you, " + enquiry.name + "!</strong><br>" +
          "Your enquiry about <strong>" + enquiry.enquiryType + "</strong> has been received." +
          (enquiry.eventDate !== "Not specified"
            ? "<br>Event date: <strong>" + formatDate(enquiry.eventDate) + "</strong>"
            : "") +
          "<br>MolifiStudioz will contact you on <strong>" + enquiry.phone + "</strong> " +
          "or <strong>" + enquiry.email + "</strong> to discuss availability." +
          "<br><small>Please note: this enquiry does not confirm a booking yet.</small>"
        );

        enquiryForm.reset();
      });
    }


    /* --------------------------------------------------------
       5. CONTACT FORM (contacts.html)
       -------------------------------------------------------- */
    const contactForm = document.querySelector('form:has(#contactEmail)');

    if (contactForm) {
      const contactName = document.getElementById("contactName");
      const contactEmail = document.getElementById("contactEmail");
      const contactMessage = document.getElementById("contactMessage");

      contactForm.querySelectorAll("input, textarea").forEach(function (field) {
        field.addEventListener("input", function () {
          clearError(field);
        });
      });

      contactForm.addEventListener("submit", function (event) {
        event.preventDefault();
        let firstInvalidField = null;

        if (contactName.value.trim().length < 2) {
          showError(contactName, "Please enter your name.");
          firstInvalidField = firstInvalidField || contactName;
        }

        if (!isValidEmail(contactEmail.value)) {
          showError(contactEmail, "Please enter a valid email address.");
          firstInvalidField = firstInvalidField || contactEmail;
        }

        if (contactMessage.value.trim().length < 10) {
          showError(contactMessage, "Your message must be at least 10 characters long.");
          firstInvalidField = firstInvalidField || contactMessage;
        }

        if (firstInvalidField) {
          firstInvalidField.focus();
          return;
        }

        showSuccess(contactForm,
          "<strong>Thank you, " + contactName.value.trim() + "!</strong><br>" +
          "Your message has been sent to MolifiStudioz Sound Management.<br>" +
          "We will reply to <strong>" + contactEmail.value.trim() + "</strong> " +
          "during business hours (Monday - Saturday, 08:00 - 18:00)."
        );

        contactForm.reset();
      });
    }


    /* --------------------------------------------------------
       6. AUTOMATIC FOOTER WITH THE CURRENT YEAR
       A footer is added to the bottom of every page, so the
       year never has to be updated by hand.
       -------------------------------------------------------- */
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML =
      "<p>&copy; " + new Date().getFullYear() +
      " MolifiStudioz Sound Management &middot; Pretoria, Gauteng" +
      " &middot; +27 69 635 9389 &middot; info@molifistudioz.co.za</p>";
    document.body.appendChild(footer);

  });
}


/* ------------------------------------------------------------
   Export the pure functions so they can be tested with Node.js
   (this line is ignored by the browser).
   ------------------------------------------------------------ */
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    isValidEmail,
    isValidSAPhone,
    isDateInFuture,
    formatDate
  };
}