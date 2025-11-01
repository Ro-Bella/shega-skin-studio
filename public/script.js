document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('appointment-form');
    const message = document.getElementById('message');
    const appointmentsList = document.getElementById('appointments-list');

    // 1. ቀጠሮዎችን ከሰርቨር አምጥቶ የሚያሳይ ፈንክሽን
    async function fetchAppointments() {
        try {
            // ገጹ የአስተዳዳሪ ዳሽቦርድ መሆኑን እናረጋግጥ
            const url = '/api/admin/appointments'; // አሁን ለአስተዳዳሪ ብቻ ነው የምናመጣው

            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 401) {
                    // አስተዳዳሪ ካልገባ ወደ መግቢያ ገጽ ይመልሱ
                    window.location.replace('/admin-login.html'); 
                }
                throw new Error('Failed to fetch');
            }

            const appointments = await response.json();
            
            appointmentsList.innerHTML = ''; // ያለውን ያጥፋ
            
            if (appointments.length === 0) {
                appointmentsList.innerHTML = '<li> እስካሁን የተያዘ ቀጠሮ የለም።</li>';
                return;
            }

            appointments.forEach(appt => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>ስም:</strong> ${appt.name} <br>
                    <strong>ስልክ:</strong> ${appt.phone} <br>
                    <strong>ቀን:</strong> ${appt.date} <br>
                    <strong>ሰዓት:</strong> ${appt.time} <br>
                    <strong>አገልግሎት:</strong> ${appt.service} <br>
                    <button class="delete-btn" data-id="${appt._id}">አጥፋ</button>
                `;
                appointmentsList.appendChild(li);
            });
        } catch (error) {
            console.error('Error fetching appointments:', error);
            if (appointmentsList) {
                appointmentsList.innerHTML = '<li>ቀጠሮዎችን ለማምጣት ችግር ተፈጥሯል!</li>';
            }
        }
    }

    // የአስተዳዳሪው ገጽ ላይ ብቻ ቀጠሮዎችን አምጣ
    if (appointmentsList) {
        fetchAppointments();
    }

    // 3. ቀጠሮን ለማጥፋት (Event Delegation)
    if (appointmentsList) {
        appointmentsList.addEventListener('click', async (e) => {
            // የተጫነው "አጥፋ" የሚል class ያለው ቁልፍ መሆኑን እናረጋግጥ
            if (e.target.classList.contains('delete-btn')) {
                const appointmentId = e.target.dataset.id;

                // ተጠቃሚው እርግጠኛ መሆኑን በማረጋገጫ እንጠይቅ
                if (confirm('ይህንን ቀጠሮ ለመሰረዝ እርግጠኛ ነዎት?')) {
                    const button = e.target;
                    const listItem = button.closest('li');
                    button.disabled = true; // ቁልፉን ደግመን እንዳንጫን እናግደው
                    button.textContent = 'በመሰረዝ ላይ...'; // ለተጠቃሚው ግብረ-መልስ እንስጥ

                    try {
                        const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
                            method: 'DELETE',
                        });

                        if (response.ok) {
                            // ጥያቄው ከተሳካ፣ ቀጠሮውን ከገጹ ላይ እናጥፋው
                            listItem.remove();
                        } else {
                            alert('ቀጠሮውን ለመሰረዝ አልተቻለም።');
                            button.disabled = false; // ስህተት ከተፈጠረ ቁልፉን መልሰን እናንቃው
                            button.textContent = 'አጥፋ';
                        }
                    } catch (error) {
                        console.error('Error deleting appointment:', error);
                        alert('የኔትወርክ ስህተት ተፈጥሯል!');
                        button.disabled = false;
                        button.textContent = 'አጥፋ';
                    }


                   

// 'ሁሉንም አጥፋ' የሚለውን ቁልፍ የማስተናገድ ተግባር
const deleteAllBtn = document.getElementById('deleteAllBtn');
if (deleteAllBtn) {
  deleteAllBtn.addEventListener('click', async () => {
    // ተጠቃሚው እርግጠኛ መሆኑን ለማረጋገጥ የማረጋገጫ መልዕክት እናሳያለን
    const isConfirmed = confirm('እርግጠኛ ነዎት? ይህ ሁሉንም ቀጠሮዎች እስከመጨረሻው ያጠፋቸዋል!');

    if (isConfirmed) {
      try {
        const response = await fetch('/api/admin/appointments', {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          alert(result.message);
          // ገጹን እንደገና በመጫን ወይም ዝርዝሩን በማፅዳት UIውን እናዘምነዋለን
          document.getElementById('appointments-list').innerHTML = ''; 
        } else {
          alert('ስህተት፡ ' + result.message);
        }
      } catch (error) {
        console.error('ሁሉንም ቀጠሮዎች በማጥፋት ላይ ሳለ ስህተት ተፈጥሯል:', error);
        alert('ሁሉንም ቀጠሮዎች ለማጥፋት አልተቻለም። እባክዎ እንደገና ይሞክሩ።');
      }
    }
  });
}

                }
            }
        });
    }

    // 2. ፎርሙ ሲላክ
    if (form) {
        form.addEventListener('submit', async (e) => {
        e.preventDefault(); // ፎርሙ በራሱ እንዳይላክ ያግዳል

        const appointmentData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            service: document.getElementById('service').value,
            lang: document.documentElement.lang || 'am' // የገጹን ቋንቋ አብረን እንልካለን
        };

        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(appointmentData),
            });

            const result = await response.json();

            // መልዕክት ማሳያ
            message.textContent = result.message;
            message.classList.remove('hidden', 'success', 'error');
            
            if (result.success) {
                message.classList.add('success');
                form.reset(); // ፎርሙን ባዶ ያድርግ
                if (window.location.pathname.includes('admin-dashboard.html')) {
                    fetchAppointments(); // በአስተዳዳሪ ገጽ ላይ ብቻ ቀጠሮዎቹን አድስ
                }
            } else {
                message.classList.add('error');
            }

            // ለተወሰነ ጊዜ ብቻ እንዲታይ
            setTimeout(() => {
                message.classList.add('hidden');
            }, 5000);

        } catch (error) {
            message.textContent = 'የኔትወርክ ስህተት ተፈጥሯል!';
            message.classList.remove('hidden', 'success');
            message.classList.add('error');
            setTimeout(() => {
                message.classList.add('hidden');
            }, 5000);
            console.error('Submission error:', error);
        }
    });
    }
});