// events.js

// Array of event objects
const events = [
    {
        title: "Concert at Symphony Hall",
        date: "2024-09-15",
        location: "Symphony Hall, Boston",
        description: "Performing new compositions with the Boston Symphony Orchestra.",
        link: "#"
    },
    {
        title: "Guest Lecture at Julliard",
        date: "2024-10-02",
        location: "Julliard School, New York",
        description: "Discussing modern compositional techniques in classical music.",
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
