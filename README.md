# petition

online: https://petition-jendo.herokuapp.com/register

## overview

An online petition built with Handlebars.js where users can register/login, add some additional information about themselves and sign the petition. After signing they can see a list of all fellow-signers. It's also possible to edit/update one's own profile, to unsign the petition or to delete the account again.

This project was built during the course "Full Stack Web Development" at SPICED Academy Berlin. I really enjoyed it since it gave me the opportunity to practise SQL queries and deepen my understanding of frondend-backend data flow.

## technologies used

-   **Handlebars** template for dynamically rendering content that's coming from the users and/or the database
-   **Node.js** for serverside code and **PostgreSQL** for complex database queries
-   NoSQL-database **Redis** used for storing session data and caching the results from DB queries
-   Responsive layout with **media queries and CSS flexbox**

## screenshots

Registration, adding additional information. In the registration process the password is encrypted (hashed) using `bcryt` and the hashed password is stored in the database.

![registration](https://github.com/jen-do/raw/master/public/images/Petition_registration.png)

Signing the petition. For drawing the signature a `canvas` element is used.

![signing](https://github.com/jen-do/raw/master/public/images/Petition_signature.png)

After signing you are guided to a page that's displaying a 'thank you' message and your signature. You can either unsign the petition or view a list of people who also signed. You can then also choose to only list all signers from a certain city.

I made this website responsive with a navigation switching to a hamburger-style-menu on smaller devices.
Here is how it looks like on desktop and mobile.

![signing](https://github.com/jen-do/raw/master/public/images/Petition_thank-you-page_desptop-mobile.jpg)

You can also update your profile information.
If you choose to delete your account, all information stored about you in the database is deleted, and you're automatically logged out.
