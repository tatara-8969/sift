// お客様向けページ用JavaScript
class CustomerShiftView {
    constructor() {
        this.currentMonth = new Date();
        this.staff = [];
        this.shifts = [];
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.updateCurrentTime();
        this.updateCurrentMonth();
        this.renderShiftCalendar();
        
        // 時刻を1分ごとに更新
        setInterval(() => this.updateCurrentTime(), 60000);
    }

    // データの読み込み
    async loadData() {
        try {
            await this.loadStaff();
            await this.loadShifts();
        } catch (error) {
            console.error('データの読み込みエラー:', error);
            this.showErrorMessage('データの読み込みに失敗しました');
        }
    }

    async loadStaff() {
        try {
            const response = await fetch('tables/staff');
            const result = await response.json();
            this.staff = (result.data || []).filter(staff => staff.active);
        } catch (error) {
            console.error('スタッフデータの読み込みエラー:', error);
            this.staff = [];
        }
    }

    async loadShifts() {
        try {
            const response = await fetch('tables/shifts');
            const result = await response.json();
            // キャンセルされていないシフトのみを表示
            this.shifts = (result.data || []).filter(shift => shift.status !== 'cancelled');
        } catch (error) {
            console.error('シフトデータの読み込みエラー:', error);
            this.shifts = [];
        }
    }

    // イベントリスナーの設定
    setupEventListeners() {
        document.getElementById('prev-month-customer').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('next-month-customer').addEventListener('click', () => this.changeMonth(1));
    }

    // 現在時刻の更新
    updateCurrentTime() {
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString('ja-JP', { 
                hour: '2-digit', 
                minute: '2-digit'
            });
        }
    }

    // 月の変更
    changeMonth(direction) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + direction);
        this.updateCurrentMonth();
        this.renderShiftCalendar();
    }

    updateCurrentMonth() {
        const monthElement = document.getElementById('current-month-customer');
        if (monthElement) {
            monthElement.textContent = this.formatMonth(this.currentMonth);
        }
    }

    formatMonth(date) {
        return date.toLocaleDateString('ja-JP', { 
            year: 'numeric', 
            month: 'long' 
        });
    }

    // シフトカレンダーの描画
    renderShiftCalendar() {
        const container = document.getElementById('shift-calendar');
        if (!container) return;

        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        
        // 月の最初と最後の日を取得
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // カレンダーの開始日（月曜日から始まる）
        const startDate = new Date(firstDay);
        const startDayOfWeek = (firstDay.getDay() + 6) % 7; // 月曜日を0にする
        startDate.setDate(startDate.getDate() - startDayOfWeek);
        
        // カレンダーの終了日
        const endDate = new Date(lastDay);
        const endDayOfWeek = (lastDay.getDay() + 6) % 7; // 月曜日を0にする
        endDate.setDate(endDate.getDate() + (6 - endDayOfWeek));

        // カレンダーグリッドを作成
        let calendarHTML = `
            <div class="calendar-grid">
                <div class="calendar-header font-semibold text-center py-2 bg-gray-100 text-gray-700">月</div>
                <div class="calendar-header font-semibold text-center py-2 bg-gray-100 text-gray-700">火</div>
                <div class="calendar-header font-semibold text-center py-2 bg-gray-100 text-gray-700">水</div>
                <div class="calendar-header font-semibold text-center py-2 bg-gray-100 text-gray-700">木</div>
                <div class="calendar-header font-semibold text-center py-2 bg-gray-100 text-gray-700">金</div>
                <div class="calendar-header font-semibold text-center py-2 bg-gray-100 text-gray-700">土</div>
                <div class="calendar-header font-semibold text-center py-2 bg-gray-100 text-gray-700">日</div>
        `;

        // 日付セルを生成
        const currentDate = new Date(startDate);
        const today = new Date();
        
        while (currentDate <= endDate) {
            const dayNumber = currentDate.getDate();
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = this.isSameDate(currentDate, today);
            const dateString = this.formatDateForAPI(currentDate);
            
            // その日のシフトを取得
            const dayShifts = this.getDayShifts(dateString);
            
            let dayClass = 'calendar-day';
            if (!isCurrentMonth) dayClass += ' other-month';
            if (isToday) dayClass += ' today';
            
            calendarHTML += `
                <div class="${dayClass}">
                    <div class="calendar-day-number">${dayNumber}</div>
                    ${this.renderDayShifts(dayShifts)}
                </div>
            `;
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        calendarHTML += '</div>';
        
        // データがない場合のメッセージ
        if (this.shifts.length === 0) {
            calendarHTML += `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-calendar-times text-4xl mb-4"></i>
                    <p>シフトが登録されていません</p>
                </div>
            `;
        }
        
        container.innerHTML = calendarHTML;
    }

    // 指定日のシフトを取得
    getDayShifts(dateString) {
        return this.shifts.filter(shift => shift.date === dateString);
    }

    // 日のシフトを描画
    renderDayShifts(shifts) {
        if (shifts.length === 0) return '';
        
        // シフトを時間順にソート
        shifts.sort((a, b) => a.start_time.localeCompare(b.start_time));
        
        return shifts.map(shift => {
            const staff = this.staff.find(s => s.id === shift.staff_id);
            const staffName = staff ? (staff.display_name || staff.name) : '不明';
            const statusClass = shift.status;
            const timeRange = `${shift.start_time.slice(0, 5)}-${shift.end_time.slice(0, 5)}`;
            
            return `
                <div class="calendar-shift ${statusClass}" title="${staffName} ${timeRange} (${this.getStatusText(shift.status)})">
                    ${staffName} ${timeRange}
                </div>
            `;
        }).join('');
    }

    // ユーティリティメソッド
    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    formatDateForAPI(date) {
        return date.toISOString().split('T')[0];
    }

    getStatusText(status) {
        switch (status) {
            case 'confirmed': return '確定';
            case 'scheduled': return '予定';
            case 'cancelled': return 'キャンセル';
            default: return '不明';
        }
    }

    showErrorMessage(message) {
        const container = document.getElementById('shift-calendar');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                        <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
                        <p class="text-red-700 font-medium">${message}</p>
                        <p class="text-red-600 text-sm mt-2">しばらく待ってから再度お試しください</p>
                    </div>
                </div>
            `;
        }
    }
}

// DOMの読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
    new CustomerShiftView();
});