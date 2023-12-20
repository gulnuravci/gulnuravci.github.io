function handleClick(event) {
    event.preventDefault();

    // Find the closest parent anchor tag
    var anchor = event.target.closest('a');
    var href = anchor ? anchor.getAttribute('href') : 'default-fallback-url.html'; // Provide a default URL in case none is found

    var isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;

    if (isMobile) {
        // Redirect to the PDF for mobile users
        window.location.href = '../images/NASA/Avci_Developing_the_GlennHT_GUI_07Jan22.pdf'; // Adjust the path as needed
    } else {
        // Redirect to the HTML page for desktop users
        window.location.href = href;
    }
}
