/** Shared test fixtures (only imported by tests, never by production code). */

const filler =
  'Collaborated with product managers, designers and QA engineers to plan sprints, review pull requests and keep documentation up to date across several services and teams.';

export const GOOD_CV = `Ana Perez
Senior Frontend Developer
ana.perez@example.com | +54 9 387 555 1234
linkedin.com/in/ana-perez | github.com/anaperez

Summary
Frontend developer with a focus on accessible, high-performance web applications built with React, TypeScript and Node.js.

Experience
Acme Corp - Senior Frontend Developer
Jan 2021 - Mar 2024
- Led a team of 5 engineers and delivered a design system used by 12 products.
- Reduced page load time by 40% by implementing code splitting and caching.
- Developed a checkout flow that increased conversion by 18% and generated $250k in annual revenue.
- Migrated 30 legacy screens from jQuery to React, cutting bug reports by 60%.
- Automated the release pipeline with GitHub Actions and deployed 3 times per day.
${filler}
Globex - Frontend Developer
Feb 2018 - Dec 2020
- Built a dashboard with TypeScript and React serving 20000 monthly users.
- Designed REST integrations and optimized queries, improving response time by 35%.
- Mentored 4 junior developers and coordinated weekly code reviews.
- Created an automated testing suite with Jest and Cypress covering 85% of the code.
- Implemented accessibility improvements that reached WCAG AA compliance.
${filler}

Education
B.Sc. in Computer Science - National University
Mar 2013 - Dec 2017

Skills
JavaScript, TypeScript, React, Node.js, CSS, HTML, Jest, Cypress, GitHub Actions, REST, GraphQL, Docker

Projects
Open source contributor to several UI libraries. ${filler} ${filler}
Maintained a public component library with documentation, examples, tests and a continuous delivery pipeline used by many teams around the world. ${filler}
`;

export const WEAK_CV = `Juan
I am a hard worker. I think my skills are good and I like my job. I want a job where I can use my skills.
I did many things in my work and my boss liked me.`;

export const GOOD_CV_ES = `María López
Desarrolladora Backend
maria.lopez@ejemplo.com · +54 11 5555 1234
github.com/marialopez

Experiencia laboral
Empresa Uno - Desarrolladora Backend
Marzo 2020 - Enero 2024
• Lideré la migración de 15 servicios a contenedores, reduciendo costos en 30%.
• Desarrollé APIs que atienden 5000 solicitudes por minuto.
• Implementé pruebas automatizadas y mejoré la cobertura al 80%.
• Diseñé el modelo de datos de un sistema de facturación para 200 clientes.
• Optimicé consultas SQL y reduje los tiempos de respuesta en 45%.
• Coordiné un equipo de 4 personas durante dos lanzamientos.

Educación
Ingeniería en Sistemas - Universidad Nacional
Marzo 2014 - Diciembre 2019

Habilidades
Java, Spring, SQL, Docker, Kubernetes, AWS
`;

export const GOOD_PORTFOLIO_HTML = `<!doctype html>
<html lang="en"><head>
<title>Ana Perez - Frontend Developer Portfolio</title>
<meta name="description" content="Frontend developer building accessible and fast web applications with React and TypeScript.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{margin:0}</style><script>var x = 1;</script>
</head><body>
<header><h1>Ana Perez</h1><p>Frontend developer specialised in React, TypeScript and accessibility.</p></header>
<section id="projects"><h2>Projects</h2>
<article><h3>Shop UI</h3><p>React storefront. <a href="https://shop.example.dev">Live demo</a></p><img src="a.png" alt="Shop screenshot"></article>
<article><h3>Chat App</h3><p>WebSocket chat. <a href="https://github.com/ana/chat">Source</a></p><img src="b.png" alt="Chat screenshot"></article>
<article><h3>Dashboard</h3><p>Analytics dashboard with TypeScript.</p><img src="c.png" alt="Dashboard"></article>
</section>
<footer><a href="https://github.com/ana">GitHub</a> <a href="https://linkedin.com/in/ana">LinkedIn</a>
<a href="mailto:ana@example.com">Contact me</a></footer>
</body></html>`;

export const WEAK_PORTFOLIO_HTML = `<html><head><title>Home</title></head><body><h1>Welcome</h1><img src="x.png"><p>Under construction.</p></body></html>`;

export const GOOD_LINKEDIN = `Contact
ana.perez@example.com
www.linkedin.com/in/ana-perez (LinkedIn)

Top Skills
React
TypeScript
Node.js

Ana Perez
Senior Frontend Developer | React · TypeScript · Accessibility
Buenos Aires, Argentina

Summary
${'I build accessible and performant web applications and lead frontend teams. '.repeat(10)}

Experience
Acme Corp
Senior Frontend Developer
January 2021 - Present (3 years)
Led the frontend guild, defined coding standards and delivered a design system adopted by twelve product teams.
Reduced page load time by forty percent through code splitting, caching and image optimization work.
Globex
Frontend Developer
February 2018 - December 2020 (3 years)
Built and maintained a React dashboard used by thousands of customers every single month.

Education
National University
Bachelor's degree, Computer Science

Skills
React, TypeScript, Node.js, CSS, Jest, Docker

Licenses & Certifications
AWS Certified Cloud Practitioner

Recommendations
Received 3 recommendations
`;

export const WEAK_LINKEDIN = `Juan Gomez
Student
Salta

Experience
Intern
`;

export const JOB_DESCRIPTION = `We are looking for a Senior Frontend Developer with strong React and TypeScript experience.
You will build accessible interfaces, maintain a design system and mentor developers.
Requirements: React, TypeScript, accessibility, design system, testing with Jest, GraphQL.`;
