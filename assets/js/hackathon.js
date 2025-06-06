document.addEventListener('DOMContentLoaded', function () {
    const db = firebase.firestore();

    // Fetch and display hackathons from JSON file
    fetch('assets/js/hackathons.json')
        .then(response => response.json())
        .then(hackathons => {
            const hackathonCards = document.getElementById('hackathon-cards');
            const hackathonSelect = document.getElementById('hackathon-select');
            hackathons.forEach(hackathon => {
                hackathonCards.innerHTML += `
                    <div class="hackathon-card">
                        <h2>${hackathon.name}</h2>
                        <p>${hackathon.description}</p>
                        <p><strong>Date:</strong> ${hackathon.date}</p>
                    </div>
                `;
                hackathonSelect.innerHTML += `<option value="${hackathon.id}">${hackathon.name}</option>`;
            });
        }).catch(error => {
            console.error('Error fetching hackathons:', error);
        });

    // Handle hackathon registration
    document.getElementById('hackathon-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const user = firebase.auth().currentUser;
        if (!user) {
            alert('Please sign in to register for a hackathon.');
            return;
        }

        const hackathonId = document.getElementById('hackathon-select').value;
        const teamName = document.getElementById('team-name').value;
        const teamMembers = document.getElementById('team-members').value.split(',').map(email => email.trim());

        // Check if the team is already registered for the hackathon
        db.collection('hackathon_registrations')
            .where('hackathonId', '==', hackathonId)
            .where('teamName', '==', teamName)
            .get()
            .then(querySnapshot => {
                if (!querySnapshot.empty) {
                    // Team is already registered
                    showAlreadyRegisteredPopup();
                } else {
                    // Team is not registered, proceed with registration
                    db.collection('hackathon_registrations').add({
                        hackathonId,
                        teamName,
                        teamMembers,
                        registeredBy: user.email,
                        registeredAt: firebase.firestore.Timestamp.now()
                    }).then(() => {
                        // Show success message
                        showSuccessPopup();
                    }).catch((error) => {
                        console.error('Error registering for hackathon: ', error);
                        alert('Error registering for hackathon: ' + error.message);
                    });
                }
            }).catch((error) => {
                console.error('Error checking registration: ', error);
                alert('Error checking registration: ' + error.message);
            });
    });

    // Function to show success popup
    function showSuccessPopup() {
        const popup = document.createElement('div');
        popup.classList.add('success-popup');
        popup.innerHTML = `
            <div class="popup-content">
                <p>Registration successful!</p>
                <button onclick="closePopup()">Close</button>
            </div>
        `;
        document.body.appendChild(popup);
    }

    // Function to show already registered popup
    function showAlreadyRegisteredPopup() {
        const popup = document.createElement('div');
        popup.classList.add('already-registered-popup');
        popup.innerHTML = `
            <div class="popup-content">
                <p>This team is already registered for the selected hackathon.</p>
                <button onclick="closePopup()">Close</button>
            </div>
        `;
        document.body.appendChild(popup);
    }

    // Function to close the popup
    window.closePopup = function () {
        const popup = document.querySelector('.success-popup, .already-registered-popup');
        if (popup) {
            popup.remove();
        }
    }
});
