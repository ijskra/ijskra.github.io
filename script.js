document.addEventListener('DOMContentLoaded', function() {
    // ... (keep your existing code)

    // Dynamic project generation
    const projectGrid = document.getElementById('project-grid');

    function createProjectElement(project) {
        const projectElement = document.createElement('div');
        projectElement.className = 'project';
        projectElement.dataset.tags = project.tags.map(tag => `#${tag}`).join(' ');

        projectElement.innerHTML = `
            <img src="${project.imageUrl}" alt="${project.title}">
            <div class="project-info">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <p class="project-tags">
                    ${project.tags.map(tag => `<span class="hashtag">#${tag}</span>`).join(' ')}
                </p>
                <a href="${project.link}" class="btn">View Project</a>
            </div>
        `;

        return projectElement;
    }

    function renderProjects(projects) {
        projectGrid.innerHTML = '';
        projects.forEach(project => {
            projectGrid.appendChild(createProjectElement(project));
        });
    }

    renderProjects(projectsData);

    // Project search functionality
    const projectSearch = document.getElementById('project-search');

    projectSearch.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();

        const filteredProjects = projectsData.filter(project => 
            searchTerm === '' || project.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );

        renderProjects(filteredProjects);
    });
});
