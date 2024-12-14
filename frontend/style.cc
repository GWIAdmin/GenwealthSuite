:root {
    --primary-color: #552583; /* Deep Purple */
    --secondary-color: #FDB927; /* Gold */
    --text-color: #333333;
    --background-color: #f5f5f5;
    --font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

body {
    margin: 0;
    padding: 0;
    font-family: var(--font-family);
    background-color: var(--background-color);
    color: var(--text-color);
}

/* HEADER & NAV */
header {
    background-color: var(--primary-color);
}

.top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
}

.logo {
    height: 50px;
    display: block;
}

.nav-links {
    list-style: none;
    display: flex;
    gap: 20px;
}

.nav-links li {
    margin: 0;
}

.nav-links a {
    color: #ffffff;
    text-decoration: none;
    font-weight: bold;
    transition: opacity 0.3s ease;
}

.nav-links a:hover {
    opacity: 0.8;
}

/* HERO SECTION */
.hero {
    background: linear-gradient(rgba(85,37,131,0.7), rgba(85,37,131,0.7)), url('images/hero-background.jpg') center/cover no-repeat;
    color: #ffffff;
    text-align: center;
    padding: 100px 20px;
}

.hero-content h1 {
    font-size: 3em;
    margin-bottom: 20px;
    font-weight: bold;
}

.hero-content p {
    max-width: 600px;
    margin: 0 auto 30px;
    line-height: 1.6;
}

/* CTA BUTTON */
.cta-button {
    background-color: var(--secondary-color);
    border: none;
    padding: 15px 30px;
    font-size: 1em;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    color: #ffffff;
    transition: background-color 0.3s ease;
}

.cta-button:hover {
    background-color: #e1a917;
}

/* SERVICES SECTION */
.services {
    text-align: center;
    padding: 60px 20px;
    background-color: #ffffff;
}

.services h2 {
    font-size: 2em;
    margin-bottom: 40px;
    color: var(--primary-color);
}

.service-cards {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
}

.card {
    background-color: #ffffff;
    border: 1px solid #ddd;
    border-radius: 8px;
    width: 300px;
    padding: 20px;
    text-align: center;
    transition: box-shadow 0.3s ease;
}

.card:hover {
    box-shadow: 0 4px 14px rgba(0,0,0,0.1);
}

.card h3 {
    margin-bottom: 15px;
    color: var(--primary-color);
}

.card p {
    line-height: 1.5;
}

/* APPROACH SECTION */
.approach {
    padding: 60px 20px;
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
}

.approach h2 {
    font-size: 2em;
    margin-bottom: 20px;
    color: var(--primary-color);
}

.approach p {
    line-height: 1.7;
}

/* TESTIMONIALS SECTION */
.testimonials {
    background-color: #ffffff;
    padding: 60px 20px;
    text-align: center;
}

.testimonials h2 {
    font-size: 2em;
    margin-bottom: 40px;
    color: var(--primary-color);
}

.testimonial-box {
    background-color: #fefefe;
    border: 1px solid #ddd;
    border-radius: 8px;
    display: inline-block;
    padding: 30px;
    max-width: 600px;
    line-height: 1.5;
}

.testimonial-box p {
    font-style: italic;
    margin-bottom: 20px;
}

.testimonial-box span {
    display: block;
    font-weight: bold;
    color: var(--secondary-color);
}

/* CONTACT SECTION */
.contact {
    padding: 60px 20px;
    text-align: center;
    background-color: #ffffff;
}

.contact h2 {
    font-size: 2em;
    margin-bottom: 20px;
    color: var(--primary-color);
}

.contact-form {
    max-width: 500px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.contact-form input, 
.contact-form textarea {
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
    font-size: 1em;
    resize: vertical;
}

/* FOOTER */
footer {
    background-color: var(--primary-color);
    text-align: center;
    padding: 15px 0;
    color: #ffffff;
    margin-top: 40px;
    font-size: 0.9em;
}
