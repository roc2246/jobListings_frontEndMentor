var ghpages = require('gh-pages');

ghpages.publish(
    'public', // path to public directory
    {
        branch: '(root)',
        repo: 'https://github.com/roc2246/jobListings_frontEndMentor', // Update to point to your repository  
        user: {
            name: 'Riley', // update to use your name
            email: 'childswebdev@gmail.com' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)