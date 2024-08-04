// events.js

// Array of event objects
const events = [
    {
        title: "IU New Voices Orchestra Concert",
        date: "2024-11-19",
        location: "Auer Hall, Indiana",
        description: "Performing a new composition with IU New Voices Orchestra.",
        link: "#"
    },
    {
        title: "Microtonal Seminar Concert",
        date: "TBA",
        location: "Seoul",
        description: "Discussing microtonalities in new music.",
        link: "#"
    },
    // Add more events as needed
];

// Function to populate the events grid
function populateEvents() {
    const eventGrid = document.getElementById('event-grid');
    
    events.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        
        eventElement.innerHTML = `
            <h3>${event.title}</h3>
            <p class="event-date">Date: ${event.date}</p>
            <p class="event-location">Location: ${event.location}</p>
            <p class="event-description">${event.description}</p>
            <a href="${event.link}" class="event-link">More Info</a>
        `;
        
        eventGrid.appendChild(eventElement);
    });
}

// Call the function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', populateEvents);
