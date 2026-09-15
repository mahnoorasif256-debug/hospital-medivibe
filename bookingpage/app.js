// App State
class AppointmentApp {
  constructor() {
    this.selectedProviderId = PROVIDERS[0].id;
    this.selectedServiceId = SERVICES[0].id;

    const today = new Date();
    this.selectedDateStr = formatDateKey(today);
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();

    this.selectedSlotTime = null;
    this.selectedDuration = SERVICES[0].durationMinutes;
    this.selectedTimezone = TIMEZONES[0].value;

    this.isBookingModalOpen = false;
    this.isMyBookingsDrawerOpen = false;
    this.isDemoModalOpen = false;

    // Booking Form state
    this.clientName = '';
    this.clientEmail = '';
    this.clientPhone = '';
    this.notes = '';
    this.isSubmitting = false;
    this.bookingSuccess = false;
    this.createdAppointment = null;

    // Hold Countdown
    this.holdTimeLeft = 300;
    this.countdownTimer = null;

    // Drawer search state
    this.searchEmail = '';
    this.cancellingId = null;

    // Demo Modal copy state
    this.copied = false;

    // Initialize Realtime Sync Manager
    this.sync = new RealtimeSyncManager(() => this.renderAll());

    this.initDOM();
  }

  initDOM() {
    this.renderAll();
  }

  renderAll() {
    this.renderHeader();
    this.renderProviders();
    this.renderServices();
    this.renderCalendar();
    this.renderTimeSlots();
    this.renderBookingModal();
    this.renderMyBookingsDrawer();
    this.renderDemoModal();
  }

  // --- 1. HEADER ---
  renderHeader() {
    const el = document.getElementById('sync-header');
    if (!el) return;

    const myBookingsCount = this.sync.appointments.length;

    el.innerHTML = `
      <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            ${icon('calendarCheck', 'w-5 h-5 text-[#F2EFE9]')}
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-lg font-bold text-[#2C2B27] tracking-tight">Book Appointment</h1>
              <span class="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F2EFE9] text-[#5A5A40] border border-[#D1CFC7]">
                ${icon('zap', 'w-3 h-3 mr-1 fill-[#5A5A40] text-[#5A5A40]')} Real-time Sync
              </span>
            </div>
            <p class="text-xs text-[#8A8882]">Select host, service, date, and available time slot</p>
          </div>
        </div>

        <div class="flex items-center space-x-2 sm:space-x-3">
          <div class="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#FDFCFB] border border-[#EAE7E1] text-xs text-[#4A4944]">
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${this.sync.isConnected ? 'bg-emerald-400' : 'bg-amber-400'}"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 ${this.sync.isConnected ? 'bg-emerald-600' : 'bg-amber-500'}"></span>
            </span>
            <span class="font-medium">
              ${this.sync.isConnected ? 'Real-time Sync Active' : 'Connecting...'}
            </span>
            <div class="h-3.5 w-[1px] bg-[#EAE7E1] my-auto hidden sm:block"></div>
            <div class="flex items-center space-x-1 text-[#4A4944]" title="Active users viewing availability">
              ${icon('users', 'w-3.5 h-3.5 text-[#8A8882]')}
              <span class="font-semibold text-[#2C2B27]">${this.sync.activeClientsCount}</span>
              <span class="hidden md:inline text-[#8A8882]">active</span>
            </div>
          </div>

          <button id="btn-open-demo" class="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-[#5A5A40] bg-[#F2EFE9] hover:bg-[#EAE6DF] border border-[#D1CFC7] rounded-lg transition-colors cursor-pointer">
            ${icon('activity', 'w-3.5 h-3.5 text-[#5A5A40]')}
            <span class="hidden sm:inline">Test Live Sync</span>
          </button>

          <button id="btn-open-my-bookings" class="relative inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#484833] rounded-lg shadow-sm transition-all cursor-pointer">
            ${icon('calendarCheck', 'w-3.5 h-3.5')}
            <span>My Bookings</span>
            ${myBookingsCount > 0 ? `<span class="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-[#2C2B27] text-white rounded-full">${myBookingsCount}</span>` : ''}
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-open-demo')?.addEventListener('click', () => {
      this.isDemoModalOpen = true;
      this.renderDemoModal();
    });

    document.getElementById('btn-open-my-bookings')?.addEventListener('click', () => {
      this.isMyBookingsDrawerOpen = true;
      this.renderMyBookingsDrawer();
    });
  }

  // --- 2. PROVIDERS ---
  renderProviders() {
    const el = document.getElementById('provider-container');
    if (!el) return;

    el.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold uppercase tracking-wider text-[#8A8882] flex items-center gap-1.5">
            ${icon('user', 'w-3.5 h-3.5 text-[#8A8882]')} Select Host / Specialist
          </label>
          <span class="text-xs text-[#8A8882]">${PROVIDERS.length} available hosts</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${PROVIDERS.map((prov) => {
            const isSelected = prov.id === this.selectedProviderId;
            return `
              <button
                data-provider-id="${prov.id}"
                class="provider-btn relative text-left p-3.5 rounded-xl border text-sm transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-[#5A5A40] bg-[#F2EFE9] ring-2 ring-[#5A5A40]/20 shadow-xs'
                    : 'border-[#EAE7E1] hover:border-[#D1CFC7] bg-white hover:bg-[#F9F7F4]'
                }"
              >
                <div class="flex items-start space-x-3">
                  <img src="${prov.avatar}" alt="${prov.name}" class="w-10 h-10 rounded-full object-cover ring-2 ring-[#EAE7E1] flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <h3 class="font-semibold text-[#2C2B27] truncate text-sm">${prov.name}</h3>
                      ${isSelected ? icon('checkCircle', 'w-4 h-4 text-[#5A5A40] flex-shrink-0 ml-1') : ''}
                    </div>
                    <p class="text-xs text-[#8A8882] truncate mt-0.5">${prov.role}</p>
                  </div>
                </div>

                <div class="mt-3 pt-2.5 border-t border-[#EAE7E1] flex items-center justify-between text-xs text-[#4A4944]">
                  <div class="flex items-center space-x-1 text-amber-700 font-medium">
                    ${icon('star', 'w-3.5 h-3.5 text-amber-500 fill-amber-500')}
                    <span>${prov.rating}</span>
                  </div>
                  <span class="text-[11px] text-[#8A8882] truncate max-w-[120px]">
                    ${prov.specialties[0]}
                  </span>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;

    el.querySelectorAll('.provider-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-provider-id');
        this.selectedProviderId = id;
        this.renderProviders();
        this.renderCalendar();
        this.renderTimeSlots();
      });
    });
  }

  // --- 3. SERVICES ---
  renderServices() {
    const el = document.getElementById('service-container');
    if (!el) return;

    el.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold uppercase tracking-wider text-[#8A8882] flex items-center gap-1.5">
            ${icon('tag', 'w-3.5 h-3.5 text-[#8A8882]')} Appointment Type
          </label>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          ${SERVICES.map((srv) => {
            const isSelected = srv.id === this.selectedServiceId;
            return `
              <button
                data-service-id="${srv.id}"
                class="service-btn text-left p-3.5 rounded-xl border text-sm transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-[#5A5A40] bg-[#F2EFE9] ring-2 ring-[#5A5A40]/20 shadow-xs'
                    : 'border-[#EAE7E1] hover:border-[#D1CFC7] bg-white hover:bg-[#F9F7F4]'
                }"
              >
                <div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F2EFE9] text-[#5A5A40] border border-[#D1CFC7]">
                      ${srv.category}
                    </span>
                    ${isSelected ? icon('check', 'w-4 h-4 text-[#5A5A40] flex-shrink-0') : ''}
                  </div>
                  <h4 class="font-semibold text-[#2C2B27] text-sm mt-2">${srv.name}</h4>
                  <p class="text-xs text-[#8A8882] line-clamp-2 mt-1 leading-relaxed">
                    ${srv.description}
                  </p>
                </div>

                <div class="mt-3 pt-2.5 border-t border-[#EAE7E1] flex items-center justify-between text-xs">
                  <span class="flex items-center space-x-1 text-[#4A4944] font-medium">
                    ${icon('clock', 'w-3.5 h-3.5 text-[#8A8882]')}
                    <span>${srv.durationMinutes} mins</span>
                  </span>
                  <span class="font-semibold text-[#2C2B27]">
                    ${srv.price === 0 ? 'Free' : `$${srv.price}`}
                  </span>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;

    el.querySelectorAll('.service-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-service-id');
        this.selectedServiceId = id;
        const srv = SERVICES.find((s) => s.id === id);
        if (srv) {
          this.selectedDuration = srv.durationMinutes;
        }
        this.renderServices();
        this.renderTimeSlots();
      });
    });
  }

  // --- 4. CALENDAR MONTH VIEW ---
  renderCalendar() {
    const el = document.getElementById('calendar-container');
    if (!el) return;

    const MONTH_NAMES = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const daysInMonth = getDaysInMonth(this.currentYear, this.currentMonth);
    const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const paddingDays = Array.from({ length: firstDayIndex });

    const todayStr = formatDateKey(new Date());
    const slots = generateTimeSlots(this.selectedDuration);

    el.innerHTML = `
      <div class="bg-white border border-[#EAE7E1] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#EAE7E1]">
          <div class="flex items-center space-x-2">
            <div class="p-2 bg-[#F2EFE9] text-[#5A5A40] rounded-lg border border-[#D1CFC7]">
              ${icon('calendar', 'w-4 h-4')}
            </div>
            <div>
              <h2 class="font-bold text-[#2C2B27] text-base">
                ${MONTH_NAMES[this.currentMonth]} ${this.currentYear}
              </h2>
              <p class="text-xs text-[#8A8882]">Select date to view real-time time slots</p>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <button id="btn-calendar-today" class="px-2.5 py-1 text-xs font-semibold text-[#4A4944] hover:text-[#2C2B27] bg-[#F2EFE9] hover:bg-[#EAE6DF] border border-[#D1CFC7] rounded-lg transition-colors flex items-center space-x-1 cursor-pointer">
              ${icon('rotateCcw', 'w-3 h-3')}
              <span class="hidden sm:inline">Today</span>
            </button>
            <div class="flex items-center bg-[#F9F7F4] border border-[#EAE7E1] rounded-lg p-0.5">
              <button id="btn-calendar-prev" class="p-1.5 text-[#4A4944] hover:text-[#2C2B27] hover:bg-white rounded-md transition-all cursor-pointer">
                ${icon('chevronLeft', 'w-4 h-4')}
              </button>
              <button id="btn-calendar-next" class="p-1.5 text-[#4A4944] hover:text-[#2C2B27] hover:bg-white rounded-md transition-all cursor-pointer">
                ${icon('chevronRight', 'w-4 h-4')}
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-7 text-center gap-1">
          ${WEEKDAYS.map((wd) => `<div class="text-[11px] font-bold text-[#8A8882] uppercase tracking-wider py-1">${wd}</div>`).join('')}
        </div>

        <div class="grid grid-cols-7 gap-1">
          ${paddingDays.map((_, idx) => `<div class="h-14 sm:h-16 rounded-xl bg-[#F9F7F4]/40 border border-transparent"></div>`).join('')}

          ${daysInMonth.map((dayDate) => {
            const dayStr = formatDateKey(dayDate);
            const isToday = dayStr === todayStr;
            const isPast = dayStr < todayStr;
            const isSelected = dayStr === this.selectedDateStr;

            const dayApts = this.sync.appointments.filter(
              (a) => a.providerId === this.selectedProviderId && a.date === dayStr && a.status === 'confirmed'
            );
            const bookedCount = dayApts.length;
            const availableSlots = slots.length - bookedCount;
            const isFullyBooked = availableSlots <= 0;

            const heldCount = this.sync.holds.filter(
              (h) => h.providerId === this.selectedProviderId && h.date === dayStr && h.expiresAt > Date.now()
            ).length;

            return `
              <button
                ${isPast ? 'disabled' : `data-date-str="${dayStr}"`}
                class="day-btn relative h-14 sm:h-16 p-1 rounded-xl text-left border transition-all flex flex-col justify-between group ${
                  isPast
                    ? 'bg-[#F9F7F4]/50 text-[#C4C2BC] border-transparent cursor-not-allowed'
                    : isSelected
                    ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-sm ring-2 ring-[#5A5A40]/20 z-10 cursor-pointer'
                    : 'bg-white text-[#2C2B27] border-[#EAE7E1] hover:border-[#5A5A40] hover:bg-[#F2EFE9]/40 cursor-pointer'
                }"
              >
                <div class="flex items-center justify-between w-full">
                  <span class="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday && !isSelected
                      ? 'bg-[#5A5A40] text-white font-black'
                      : isToday && isSelected
                      ? 'bg-white text-[#5A5A40] font-black'
                      : ''
                  }">
                    ${dayDate.getDate()}
                  </span>

                  ${heldCount > 0 && !isPast ? `
                    <span class="w-2 h-2 rounded-full animate-pulse ${isSelected ? 'bg-amber-300' : 'bg-amber-600'}" title="${heldCount} slot(s) currently being viewed/held"></span>
                  ` : ''}
                </div>

                ${!isPast ? `
                  <div>
                    ${isFullyBooked ? `
                      <span class="block text-[10px] font-semibold text-center rounded py-0.5 ${isSelected ? 'bg-[#484833] text-[#F2EFE9]' : 'bg-[#F9F7F4] text-[#8A8882]'}">
                        Booked
                      </span>
                    ` : `
                      <div class="flex items-center justify-between text-[10px] px-1">
                        <span class="font-semibold ${isSelected ? 'text-[#F2EFE9]' : 'text-[#8A8882]'}">
                          ${availableSlots} left
                        </span>
                      </div>
                    `}
                  </div>
                ` : ''}
              </button>
            `;
          }).join('')}
        </div>

        <div class="pt-3 border-t border-[#EAE7E1] flex flex-wrap items-center justify-between text-xs text-[#8A8882] gap-2">
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-1">
              <span class="w-2.5 h-2.5 rounded-full bg-[#5A5A40]"></span>
              <span>Today</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-600 animate-pulse"></span>
              <span>Held in Real-time</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="w-2.5 h-2.5 rounded-full bg-[#C4C2BC]"></span>
              <span>Booked / Past</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-calendar-today')?.addEventListener('click', () => {
      const today = new Date();
      this.currentYear = today.getFullYear();
      this.currentMonth = today.getMonth();
      this.selectedDateStr = formatDateKey(today);
      this.renderCalendar();
      this.renderTimeSlots();
    });

    document.getElementById('btn-calendar-prev')?.addEventListener('click', () => {
      if (this.currentMonth === 0) {
        this.currentMonth = 11;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
      this.renderCalendar();
    });

    document.getElementById('btn-calendar-next')?.addEventListener('click', () => {
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
      this.renderCalendar();
    });

    el.querySelectorAll('.day-btn[data-date-str]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const str = btn.getAttribute('data-date-str');
        this.selectedDateStr = str;
        this.renderCalendar();
        this.renderTimeSlots();
      });
    });
  }

  // --- 5. TIME SLOT GRID ---
  renderTimeSlots() {
    const el = document.getElementById('timeslot-container');
    if (!el) return;

    const slots = generateTimeSlots(this.selectedDuration);
    const morningSlots = slots.filter((s) => parseInt(s.split(':')[0], 10) < 12);
    const afternoonSlots = slots.filter((s) => parseInt(s.split(':')[0], 10) >= 12);

    const formattedDate = new Date(this.selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const renderSlotGroup = (title, groupSlots) => {
      if (!groupSlots || groupSlots.length === 0) return '';
      return `
        <div class="space-y-2">
          <h4 class="text-xs font-bold uppercase tracking-wider text-[#8A8882]">${title}</h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            ${groupSlots.map((time24) => {
              const status = getSlotStatus(
                this.selectedProviderId,
                this.selectedDateStr,
                time24,
                this.sync.appointments,
                this.sync.holds,
                this.sync.clientId
              );

              const formattedTime = format12Hour(time24);

              if (status === 'booked') {
                return `
                  <button disabled class="py-2.5 px-3 rounded-xl border border-[#EAE7E1] bg-[#F9F7F4] text-[#C4C2BC] text-xs font-medium cursor-not-allowed flex items-center justify-between opacity-75">
                    <span class="line-through">${formattedTime}</span>
                    <span class="text-[10px] font-semibold bg-[#EAE7E1] text-[#8A8882] px-1.5 py-0.5 rounded">
                      Booked
                    </span>
                  </button>
                `;
              }

              if (status === 'held_by_other') {
                return `
                  <div class="py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50/80 text-amber-950 text-xs font-medium flex items-center justify-between ring-1 ring-amber-500/20" title="Reserved by another live user in real-time">
                    <span class="font-semibold text-amber-950">${formattedTime}</span>
                    <span class="flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      ${icon('lock', 'w-3 h-3 text-amber-700 animate-pulse')}
                      <span>Held</span>
                    </span>
                  </div>
                `;
              }

              if (status === 'held_by_me') {
                return `
                  <button data-release-slot="${time24}" class="release-slot-btn py-2.5 px-3 rounded-xl border-2 border-[#5A5A40] bg-[#5A5A40] text-white text-xs font-semibold shadow-sm flex items-center justify-between ring-2 ring-[#5A5A40]/20 transition-all transform scale-[1.02] cursor-pointer">
                    <span>${formattedTime}</span>
                    <span class="flex items-center space-x-1 text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">
                      ${icon('check', 'w-3 h-3')}
                      <span>Hold Active</span>
                    </span>
                  </button>
                `;
              }

              return `
                <button data-select-slot="${time24}" class="select-slot-btn py-2.5 px-3 rounded-xl border border-[#EAE7E1] bg-white hover:bg-[#5A5A40] hover:text-white hover:border-[#5A5A40] text-[#2C2B27] text-xs font-semibold transition-all shadow-2xs hover:shadow-xs flex items-center justify-between group cursor-pointer">
                  <span>${formattedTime}</span>
                  <span class="text-[10px] text-[#8A8882] group-hover:text-[#F2EFE9] font-normal">
                    Select
                  </span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    };

    el.innerHTML = `
      <div class="bg-white border border-[#EAE7E1] rounded-2xl p-4 sm:p-5 shadow-xs space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EAE7E1]">
          <div>
            <h3 class="font-bold text-[#2C2B27] text-base flex items-center gap-2">
              Available Time Slots
              <span class="text-xs font-medium text-[#5A5A40] bg-[#F2EFE9] px-2.5 py-0.5 rounded-full border border-[#D1CFC7]">
                ${formattedDate}
              </span>
            </h3>
            <p class="text-xs text-[#8A8882] mt-0.5">Click any time slot to lock and start booking</p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <div class="flex items-center bg-[#F9F7F4] border border-[#EAE7E1] p-1 rounded-xl">
              <span class="text-[11px] font-bold text-[#8A8882] px-2 flex items-center gap-1">
                ${icon('clock', 'w-3 h-3')} Duration:
              </span>
              ${[15, 30, 45, 60].map((dur) => `
                <button data-duration="${dur}" class="dur-btn px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  this.selectedDuration === dur ? 'bg-[#5A5A40] text-white shadow-2xs' : 'text-[#4A4944] hover:text-[#2C2B27]'
                }">
                  ${dur}m
                </button>
              `).join('')}
            </div>

            <div class="relative">
              <select id="select-timezone" class="appearance-none bg-[#F9F7F4] border border-[#EAE7E1] text-[#2C2B27] text-xs font-medium py-1.5 pl-7 pr-7 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] cursor-pointer">
                ${TIMEZONES.map((tz) => `
                  <option value="${tz.value}" ${tz.value === this.selectedTimezone ? 'selected' : ''}>
                    ${tz.label}
                  </option>
                `).join('')}
              </select>
              ${icon('globe', 'w-3.5 h-3.5 text-[#8A8882] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none')}
            </div>
          </div>
        </div>

        <div class="space-y-4">
          ${renderSlotGroup('Morning', morningSlots)}
          ${renderSlotGroup('Afternoon', afternoonSlots)}
        </div>

        <div class="p-3 rounded-xl bg-[#F2EFE9] border border-[#D1CFC7] flex items-center space-x-3 text-xs text-[#4A4944]">
          ${icon('sparkles', 'w-4 h-4 text-[#5A5A40] flex-shrink-0')}
          <p class="leading-relaxed">
            Selecting a time slot holds it exclusively for you for <strong>5 minutes</strong> in real-time across all visitors.
          </p>
        </div>
      </div>
    `;

    el.querySelectorAll('.dur-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedDuration = parseInt(btn.getAttribute('data-duration'), 10);
        this.renderCalendar();
        this.renderTimeSlots();
      });
    });

    document.getElementById('select-timezone')?.addEventListener('change', (e) => {
      this.selectedTimezone = e.target.value;
    });

    el.querySelectorAll('.select-slot-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const time24 = btn.getAttribute('data-select-slot');
        this.selectedSlotTime = time24;
        this.sync.holdSlot(this.selectedProviderId, this.selectedDateStr, time24);
        this.openBookingModal();
      });
    });

    el.querySelectorAll('.release-slot-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const time24 = btn.getAttribute('data-release-slot');
        this.sync.releaseSlot(this.selectedProviderId, this.selectedDateStr, time24);
        this.renderTimeSlots();
      });
    });
  }

  // --- 6. BOOKING FORM MODAL ---
  openBookingModal() {
    this.isBookingModalOpen = true;
    this.bookingSuccess = false;
    this.createdAppointment = null;
    this.holdTimeLeft = 300;

    clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      this.holdTimeLeft--;
      if (this.holdTimeLeft <= 0) {
        clearInterval(this.countdownTimer);
        this.closeBookingModal();
      } else {
        const timerEl = document.getElementById('hold-timer-text');
        if (timerEl) {
          const mins = Math.floor(this.holdTimeLeft / 60);
          const secs = this.holdTimeLeft % 60;
          timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
      }
    }, 1000);

    this.renderBookingModal();
  }

  closeBookingModal() {
    clearInterval(this.countdownTimer);
    if (this.selectedSlotTime && !this.bookingSuccess) {
      this.sync.releaseSlot(this.selectedProviderId, this.selectedDateStr, this.selectedSlotTime);
    }
    this.isBookingModalOpen = false;
    this.selectedSlotTime = null;
    this.renderBookingModal();
    this.renderTimeSlots();
  }

  renderBookingModal() {
    const el = document.getElementById('booking-modal-container');
    if (!el) return;

    if (!this.isBookingModalOpen || !this.selectedSlotTime) {
      el.innerHTML = '';
      return;
    }

    const provider = PROVIDERS.find((p) => p.id === this.selectedProviderId);
    const service = SERVICES.find((s) => s.id === this.selectedServiceId);

    const formattedDate = new Date(this.selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const mins = Math.floor(this.holdTimeLeft / 60);
    const secs = this.holdTimeLeft % 60;
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (this.bookingSuccess && this.createdAppointment) {
      const apt = this.createdAppointment;
      const startDateTime = new Date(`${apt.date}T${apt.timeSlot}:00`);
      const endDateTime = new Date(startDateTime.getTime() + (apt.durationMinutes || 30) * 60000);
      const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        service.name + ' with ' + provider.name
      )}&dates=${startDateTime.toISOString().replace(/-|:|\.\d\d\d/g, '')}/${endDateTime
        .toISOString()
        .replace(/-|:|\.\d\d\d/g, '')}&details=${encodeURIComponent(
        'Meeting URL: ' + apt.meetingUrl
      )}&location=${encodeURIComponent(apt.meetingUrl)}`;

      el.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#EAE7E1] overflow-hidden p-6 space-y-5 text-center">
            <div class="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              ${icon('checkCircle', 'w-8 h-8')}
            </div>
            <div>
              <h3 class="text-xl font-bold text-[#2C2B27]">Appointment Confirmed!</h3>
              <p class="text-xs text-[#8A8882] mt-1">Real-time confirmation sent to ${apt.clientEmail}</p>
            </div>

            <div class="p-4 rounded-xl bg-[#F9F7F4] border border-[#EAE7E1] text-left text-xs space-y-2">
              <div class="flex justify-between">
                <span class="text-[#8A8882]">Host:</span>
                <span class="font-semibold text-[#2C2B27]">${provider.name}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#8A8882]">Service:</span>
                <span class="font-semibold text-[#2C2B27]">${service.name}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#8A8882]">Date & Time:</span>
                <span class="font-semibold text-[#5A5A40]">${formattedDate} at ${format12Hour(apt.timeSlot)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#8A8882]">Virtual Link:</span>
                <a href="${apt.meetingUrl}" target="_blank" class="font-semibold text-[#5A5A40] underline truncate max-w-[200px]">
                  Google Meet Link
                </a>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <button id="btn-download-ics" class="py-2.5 px-3 bg-[#F2EFE9] hover:bg-[#EAE6DF] text-[#4A4944] text-xs font-semibold rounded-xl transition-colors flex items-center justify-center space-x-1.5 border border-[#D1CFC7] cursor-pointer">
                ${icon('download', 'w-3.5 h-3.5 text-[#5A5A40]')}
                <span>Download .ics</span>
              </button>

              <a href="${googleCalUrl}" target="_blank" class="py-2.5 px-3 bg-[#F2EFE9] hover:bg-[#EAE6DF] text-[#5A5A40] text-xs font-semibold rounded-xl transition-colors flex items-center justify-center space-x-1.5 border border-[#D1CFC7]">
                ${icon('calendar', 'w-3.5 h-3.5 text-[#5A5A40]')}
                <span>Google Calendar</span>
                ${icon('externalLink', 'w-3 h-3')}
              </a>
            </div>

            <button id="btn-modal-done" class="w-full py-2.5 px-4 bg-[#5A5A40] hover:bg-[#484833] text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer">
              Done
            </button>
          </div>
        </div>
      `;

      document.getElementById('btn-download-ics')?.addEventListener('click', () => {
        downloadICS(apt, provider.name, service.name);
      });

      document.getElementById('btn-modal-done')?.addEventListener('click', () => {
        this.closeBookingModal();
      });

      return;
    }

    el.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
        <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#EAE7E1] overflow-hidden">
          <div class="p-4 border-b border-[#EAE7E1] bg-[#F9F7F4] flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="p-1.5 bg-[#F2EFE9] text-[#5A5A40] rounded-lg border border-[#D1CFC7]">
                ${icon('calendar', 'w-4 h-4')}
              </span>
              <h3 class="font-bold text-[#2C2B27] text-sm">Complete Your Appointment</h3>
            </div>
            <button id="btn-modal-close" class="p-1 text-[#8A8882] hover:text-[#2C2B27] rounded-lg transition-colors cursor-pointer">
              ${icon('x', 'w-5 h-5')}
            </button>
          </div>

          <div class="p-5 space-y-4">
            <div class="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
              <div class="flex items-center space-x-1.5 font-medium">
                ${icon('lock', 'w-4 h-4 text-amber-700 animate-pulse')}
                <span>Time slot locked for you</span>
              </div>
              <span class="font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300/50">
                Holds for <span id="hold-timer-text">${timeFormatted}</span>
              </span>
            </div>

            <div class="p-4 rounded-xl bg-[#F9F7F4] border border-[#EAE7E1] space-y-2">
              <div class="flex items-center justify-between text-xs text-[#8A8882]">
                <span>Selected Service</span>
                <span class="font-semibold text-[#2C2B27]">${service.name}</span>
              </div>
              <div class="flex items-center justify-between text-xs text-[#8A8882]">
                <span>Host Specialist</span>
                <span class="font-semibold text-[#2C2B27]">${provider.name}</span>
              </div>
              <div class="flex items-center justify-between text-xs text-[#8A8882]">
                <span>Date & Time</span>
                <span class="font-semibold text-[#5A5A40]">
                  ${formattedDate} at ${format12Hour(this.selectedSlotTime)} (${this.selectedDuration}m)
                </span>
              </div>
            </div>

            <form id="booking-form" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-[#4A4944] mb-1">
                  Full Name <span class="text-rose-600">*</span>
                </label>
                <div class="relative">
                  <input
                    type="text"
                    required
                    id="input-name"
                    value="${this.clientName}"
                    placeholder="e.g. Sarah Connor"
                    class="w-full pl-9 pr-3 py-2 text-sm border border-[#EAE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] bg-[#FDFCFB]"
                  />
                  ${icon('user', 'w-4 h-4 text-[#8A8882] absolute left-3 top-1/2 -translate-y-1/2')}
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#4A4944] mb-1">
                  Email Address <span class="text-rose-600">*</span>
                </label>
                <div class="relative">
                  <input
                    type="email"
                    required
                    id="input-email"
                    value="${this.clientEmail}"
                    placeholder="e.g. sarah@example.com"
                    class="w-full pl-9 pr-3 py-2 text-sm border border-[#EAE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] bg-[#FDFCFB]"
                  />
                  ${icon('mail', 'w-4 h-4 text-[#8A8882] absolute left-3 top-1/2 -translate-y-1/2')}
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#4A4944] mb-1">
                  Phone Number <span class="text-[#8A8882] font-normal">(optional)</span>
                </label>
                <div class="relative">
                  <input
                    type="tel"
                    id="input-phone"
                    value="${this.clientPhone}"
                    placeholder="+1 (555) 000-0000"
                    class="w-full pl-9 pr-3 py-2 text-sm border border-[#EAE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] bg-[#FDFCFB]"
                  />
                  ${icon('phone', 'w-4 h-4 text-[#8A8882] absolute left-3 top-1/2 -translate-y-1/2')}
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#4A4944] mb-1">
                  Meeting Topic / Notes <span class="text-[#8A8882] font-normal">(optional)</span>
                </label>
                <div class="relative">
                  <textarea
                    rows="2"
                    id="input-notes"
                    placeholder="Provide any background or goals for our session..."
                    class="w-full pl-9 pr-3 py-2 text-sm border border-[#EAE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] bg-[#FDFCFB] resize-none"
                  >${this.notes}</textarea>
                  ${icon('fileText', 'w-4 h-4 text-[#8A8882] absolute left-3 top-3')}
                </div>
              </div>

              <div class="pt-2">
                <button
                  type="submit"
                  id="btn-submit-booking"
                  class="w-full py-3 px-4 bg-[#5A5A40] hover:bg-[#484833] disabled:bg-[#D1CFC7] text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  ${icon('shieldCheck', 'w-4 h-4 text-[#F2EFE9]')}
                  <span>Confirm Appointment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-modal-close')?.addEventListener('click', () => {
      this.closeBookingModal();
    });

    document.getElementById('input-name')?.addEventListener('input', (e) => {
      this.clientName = e.target.value;
    });

    document.getElementById('input-email')?.addEventListener('input', (e) => {
      this.clientEmail = e.target.value;
    });

    document.getElementById('input-phone')?.addEventListener('input', (e) => {
      this.clientPhone = e.target.value;
    });

    document.getElementById('input-notes')?.addEventListener('input', (e) => {
      this.notes = e.target.value;
    });

    document.getElementById('booking-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.clientName || !this.clientEmail) return;

      const aptData = {
        providerId: this.selectedProviderId,
        serviceId: this.selectedServiceId,
        date: this.selectedDateStr,
        timeSlot: this.selectedSlotTime,
        durationMinutes: this.selectedDuration,
        clientName: this.clientName,
        clientEmail: this.clientEmail,
        clientPhone: this.clientPhone,
        notes: this.notes,
        timezone: this.selectedTimezone,
        meetingUrl: `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`,
      };

      await this.sync.bookSlot(aptData);

      this.createdAppointment = {
        ...aptData,
        id: `apt-${Date.now()}`,
        status: 'confirmed',
        createdAt: Date.now(),
      };
      this.bookingSuccess = true;
      clearInterval(this.countdownTimer);
      this.renderBookingModal();
      this.renderHeader();
      this.renderCalendar();
      this.renderTimeSlots();
    });
  }

  // --- 7. MY BOOKINGS DRAWER ---
  renderMyBookingsDrawer() {
    const el = document.getElementById('my-bookings-drawer-container');
    if (!el) return;

    if (!this.isMyBookingsDrawerOpen) {
      el.innerHTML = '';
      return;
    }

    const filteredAppointments = this.sync.appointments.filter((a) => {
      if (!this.searchEmail) return true;
      return a.clientEmail.toLowerCase().includes(this.searchEmail.toLowerCase());
    });

    el.innerHTML = `
      <div class="fixed inset-0 z-50 overflow-hidden animate-in fade-in">
        <div id="drawer-backdrop" class="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"></div>

        <div class="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div class="w-screen max-w-md bg-white border-l border-[#EAE7E1] shadow-2xl flex flex-col justify-between">
            <div class="p-5 border-b border-[#EAE7E1] flex items-center justify-between bg-[#F9F7F4]">
              <div class="flex items-center space-x-2.5">
                <div class="p-2 bg-[#F2EFE9] text-[#5A5A40] rounded-lg border border-[#D1CFC7]">
                  ${icon('calendarCheck', 'w-5 h-5')}
                </div>
                <div>
                  <h3 class="font-bold text-[#2C2B27] text-base">My Bookings</h3>
                  <p class="text-xs text-[#8A8882]">View and manage scheduled appointments</p>
                </div>
              </div>

              <button id="btn-close-drawer" class="p-1.5 text-[#8A8882] hover:text-[#2C2B27] rounded-lg transition-colors cursor-pointer">
                ${icon('x', 'w-5 h-5')}
              </button>
            </div>

            <div class="p-4 border-b border-[#EAE7E1] bg-white">
              <div class="relative">
                <input
                  type="text"
                  id="input-search-email"
                  placeholder="Filter by email address..."
                  value="${this.searchEmail}"
                  class="w-full pl-9 pr-3 py-2 text-xs border border-[#EAE7E1] bg-[#FDFCFB] text-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40]"
                />
                ${icon('search', 'w-4 h-4 text-[#8A8882] absolute left-3 top-1/2 -translate-y-1/2')}
              </div>
            </div>

            <div class="flex-1 overflow-y-auto p-5 space-y-3">
              ${filteredAppointments.length === 0 ? `
                <div class="text-center py-12 space-y-3">
                  <div class="w-12 h-12 bg-[#F2EFE9] text-[#5A5A40] rounded-full flex items-center justify-center mx-auto">
                    ${icon('calendar', 'w-6 h-6')}
                  </div>
                  <h4 class="font-semibold text-[#2C2B27] text-sm">No Appointments Found</h4>
                  <p class="text-xs text-[#8A8882] max-w-xs mx-auto">
                    ${this.searchEmail ? 'No bookings match your search query.' : 'You have not scheduled any appointments yet.'}
                  </p>
                </div>
              ` : filteredAppointments.map((apt) => {
                const prov = PROVIDERS.find((p) => p.id === apt.providerId);
                const srv = SERVICES.find((s) => s.id === apt.serviceId);

                const aptDate = new Date(apt.date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });

                return `
                  <div class="p-4 rounded-xl border border-[#EAE7E1] bg-[#FDFCFB] space-y-3 text-xs">
                    <div class="flex items-start justify-between">
                      <div>
                        <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#F2EFE9] text-[#5A5A40] border border-[#D1CFC7]">
                          ${srv?.name || 'Appointment'}
                        </span>
                        <h4 class="font-bold text-[#2C2B27] text-sm mt-1">with ${prov?.name || 'Host'}</h4>
                      </div>
                      <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                        Confirmed
                      </span>
                    </div>

                    <div class="space-y-1 text-[#8A8882] pt-1 border-t border-[#EAE7E1]">
                      <div class="flex items-center justify-between">
                        <span class="flex items-center space-x-1">
                          ${icon('calendar', 'w-3.5 h-3.5 text-[#8A8882]')}
                          <span>${aptDate} at ${format12Hour(apt.timeSlot)}</span>
                        </span>
                        <span>${apt.durationMinutes || 30} mins</span>
                      </div>
                      <div class="flex items-center space-x-1 text-[#4A4944]">
                        ${icon('user', 'w-3.5 h-3.5 text-[#8A8882]')}
                        <span>${apt.clientName} (${apt.clientEmail})</span>
                      </div>
                    </div>

                    <div class="pt-2 border-t border-[#EAE7E1] flex items-center justify-between">
                      <a href="${apt.meetingUrl}" target="_blank" class="px-2.5 py-1 text-[#5A5A40] bg-[#F2EFE9] hover:bg-[#EAE6DF] border border-[#D1CFC7] rounded-lg transition-colors flex items-center space-x-1 font-medium">
                        ${icon('video', 'w-3 h-3 text-[#5A5A40]')}
                        <span>Join Meet</span>
                      </a>

                      <button data-cancel-id="${apt.id}" class="btn-cancel-apt px-2 py-1 text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center space-x-1 font-medium text-xs cursor-pointer">
                        ${icon('trash2', 'w-3 h-3')}
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <div class="p-4 border-t border-[#EAE7E1] bg-[#F9F7F4]">
              <button id="btn-close-drawer-bottom" class="w-full py-2.5 bg-[#5A5A40] hover:bg-[#484833] text-white font-semibold text-xs rounded-xl cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const closeDrawer = () => {
      this.isMyBookingsDrawerOpen = false;
      this.renderMyBookingsDrawer();
    };

    document.getElementById('drawer-backdrop')?.addEventListener('click', closeDrawer);
    document.getElementById('btn-close-drawer')?.addEventListener('click', closeDrawer);
    document.getElementById('btn-close-drawer-bottom')?.addEventListener('click', closeDrawer);

    document.getElementById('input-search-email')?.addEventListener('input', (e) => {
      this.searchEmail = e.target.value;
      this.renderMyBookingsDrawer();
    });

    el.querySelectorAll('.btn-cancel-apt').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-cancel-id');
        await this.sync.cancelBooking(id);
        this.renderMyBookingsDrawer();
        this.renderHeader();
        this.renderCalendar();
        this.renderTimeSlots();
      });
    });
  }

  // --- 8. LIVE SYNC DEMO MODAL ---
  renderDemoModal() {
    const el = document.getElementById('live-sync-demo-modal-container');
    if (!el) return;

    if (!this.isDemoModalOpen) {
      el.innerHTML = '';
      return;
    }

    el.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
        <div class="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          <div class="p-5 border-b border-[#EAE7E1] bg-[#F9F7F4] flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <div class="p-2 bg-[#F2EFE9] text-[#5A5A40] rounded-xl border border-[#D1CFC7]">
                ${icon('zap', 'w-5 h-5 fill-[#5A5A40] text-[#5A5A40]')}
              </div>
              <div>
                <h3 class="font-bold text-[#2C2B27] text-base">Test Real-Time Sync</h3>
                <p class="text-xs text-[#8A8882]">Live multi-user availability synchronization</p>
              </div>
            </div>

            <button id="btn-close-demo-modal" class="p-1.5 text-[#8A8882] hover:text-[#2C2B27] rounded-lg transition-colors cursor-pointer">
              ${icon('x', 'w-5 h-5')}
            </button>
          </div>

          <div class="p-6 space-y-5">
            <div class="p-4 rounded-2xl bg-[#F2EFE9] border border-[#D1CFC7] space-y-3">
              <h4 class="font-bold text-[#2C2B27] text-sm flex items-center gap-1.5">
                ${icon('users', 'w-4 h-4 text-[#5A5A40]')} How to test with 2 windows:
              </h4>

              <ol class="text-xs text-[#4A4944] space-y-2 list-decimal list-inside leading-relaxed">
                <li>Open this app in a <strong>second browser window or tab</strong> side-by-side.</li>
                <li>Click a time slot in Window A — watch it instantly turn <strong>Locked/Held</strong> in Window B in real-time.</li>
                <li>Complete or cancel a booking to see instant calendar availability updates everywhere without page refresh.</li>
              </ol>
            </div>

            <div class="p-4 bg-[#F9F7F4] rounded-xl border border-[#EAE7E1] flex items-center justify-between text-xs">
              <div class="flex items-center space-x-2">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                <span class="font-semibold text-[#2C2B27]">WebSocket & Broadcast Sync</span>
              </div>
              <span class="font-bold text-[#2C2B27] bg-white px-2.5 py-1 rounded-md border border-[#EAE7E1] shadow-2xs">
                ${this.sync.activeClientsCount} active browser instance${this.sync.activeClientsCount === 1 ? '' : 's'}
              </span>
            </div>

            <div class="space-y-2">
              <button id="btn-demo-open-tab" class="w-full py-3 px-4 bg-[#5A5A40] hover:bg-[#484833] text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer">
                <span>Open in New Tab Now</span>
                ${icon('externalLink', 'w-4 h-4 text-[#F2EFE9]')}
              </button>

              <button id="btn-demo-copy-url" class="w-full py-2.5 px-4 bg-[#F2EFE9] hover:bg-[#EAE6DF] text-[#4A4944] border border-[#D1CFC7] font-semibold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2 cursor-pointer">
                ${icon('copy', 'w-4 h-4 text-[#5A5A40]')}
                <span>${this.copied ? 'Copied URL to Clipboard!' : 'Copy App URL'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-close-demo-modal')?.addEventListener('click', () => {
      this.isDemoModalOpen = false;
      this.renderDemoModal();
    });

    document.getElementById('btn-demo-open-tab')?.addEventListener('click', () => {
      window.open(window.location.href, '_blank');
    });

    document.getElementById('btn-demo-copy-url')?.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      this.copied = true;
      this.renderDemoModal();
      setTimeout(() => {
        this.copied = false;
        if (this.isDemoModalOpen) this.renderDemoModal();
      }, 2000);
    });
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppointmentApp();
});
