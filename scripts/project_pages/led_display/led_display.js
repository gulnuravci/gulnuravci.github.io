let slideIndex = 0;

function showSlides() {
    let slides = document.getElementsByClassName("mySlides");

    slideIndex++;

    if (slideIndex >= slides.length) {
        slideIndex = 0;
    }

    // Slide the current image out
    slides[slideIndex - 1 >= 0 ? slideIndex - 1 : slides.length - 1].style.transform = "translateX(-100%)";
    
    // Slide the next image in
    slides[slideIndex].style.transform = "translateX(0%)";

    setTimeout(showSlides, 2000); // Change slide every 2 seconds (adjust as needed)
}

document.addEventListener("DOMContentLoaded", function () {
    showSlides();
});
