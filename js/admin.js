// 管理画面用JavaScript
class ShiftManagementSystem {
    constructor() {
        this.currentMonth = new Date();
        this.staff = [];
        this.shifts = [];
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.showStaffSection();
        this.updateCurrentMonth();
    }

    // データの読み込み
    async loadData() {
        try {
            await this.loadStaff();
            await this.loadShifts();
        } catch (error) {
            console.error('データの読み込みエラー:', error);
            this.showNotification('データの読み込みに失敗しました', 'error');
        }
    }

    async loadStaff() {
        try {
            const response = await fetch('tables/staff');
            const result = await response.json();
            this.staff = result.data || [];
            this.renderStaffList();
            this.updateStaffSelect();
        } catch (error) {
            console.error('スタッフデータの読み込みエラー:', error);
            this.staff = [];
        }
    }

    async loadShifts() {
        try {
            const response = await fetch('tables/shifts');
            const result = await response.json();
            this.shifts = result.data || [];
            this.renderShiftsList();
        } catch (error) {
            console.error('シフトデータの読み込みエラー:', error);
            this.shifts = [];
        }
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // タブ切り替え
        document.getElementById('tab-staff').addEventListener('click', () => this.showStaffSection());
        document.getElementById('tab-shifts').addEventListener('click', () => this.showShiftsSection());

        // スタッフ管理
        document.getElementById('add-staff-btn').addEventListener('click', () => this.showStaffModal());
        document.getElementById('close-staff-modal').addEventListener('click', () => this.hideStaffModal());
        document.getElementById('cancel-staff').addEventListener('click', () => this.hideStaffModal());
        document.getElementById('staff-form').addEventListener('submit', (e) => this.handleStaffSubmit(e));

        // シフト管理
        document.getElementById('shift-form').addEventListener('submit', (e) => this.handleShiftSubmit(e));
        document.getElementById('prev-month').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('next-month').addEventListener('click', () => this.changeMonth(1));

        // モーダル外クリックで閉じる
        document.getElementById('staff-modal').addEventListener('click', (e) => {
            if (e.target.id === 'staff-modal') this.hideStaffModal();
        });
    }

    // タブ表示制御
    showStaffSection() {
        document.getElementById('staff-section').classList.remove('hidden');
        document.getElementById('shifts-section').classList.add('hidden');
        
        document.getElementById('tab-staff').classList.add('active', 'border-primary-500', 'text-primary-600');
        document.getElementById('tab-staff').classList.remove('border-transparent', 'text-gray-500');
        
        document.getElementById('tab-shifts').classList.remove('active', 'border-primary-500', 'text-primary-600');
        document.getElementById('tab-shifts').classList.add('border-transparent', 'text-gray-500');
    }

    showShiftsSection() {
        document.getElementById('shifts-section').classList.remove('hidden');
        document.getElementById('staff-section').classList.add('hidden');
        
        document.getElementById('tab-shifts').classList.add('active', 'border-primary-500', 'text-primary-600');
        document.getElementById('tab-shifts').classList.remove('border-transparent', 'text-gray-500');
        
        document.getElementById('tab-staff').classList.remove('active', 'border-primary-500', 'text-primary-600');
        document.getElementById('tab-staff').classList.add('border-transparent', 'text-gray-500');
    }

    // スタッフ管理
    renderStaffList() {
        const container = document.getElementById('staff-list');
        if (!container) return;

        if (this.staff.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-users text-4xl mb-4"></i>
                    <p>スタッフが登録されていません</p>
                    <p class="text-sm">「スタッフ追加」ボタンから登録してください</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.staff.map(staff => `
            <div class="staff-card bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                <div class="flex items-center">
                    <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-user text-primary-600"></i>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-900">${staff.name}</h4>
                        <p class="text-sm text-gray-600">表示名: ${staff.display_name || staff.name}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="badge ${staff.active ? 'success' : 'danger'}">
                        ${staff.active ? 'アクティブ' : '非アクティブ'}
                    </span>
                    <button onclick="shiftSystem.toggleStaffActive('${staff.id}')" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-${staff.active ? 'pause' : 'play'}"></i>
                    </button>
                    <button onclick="shiftSystem.deleteStaff('${staff.id}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    showStaffModal() {
        document.getElementById('staff-modal').classList.remove('hidden');
        document.getElementById('staff-modal').classList.add('flex');
        document.getElementById('staff-name').focus();
    }

    hideStaffModal() {
        document.getElementById('staff-modal').classList.add('hidden');
        document.getElementById('staff-modal').classList.remove('flex');
        document.getElementById('staff-form').reset();
    }

    async handleStaffSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('staff-name').value.trim();
        const displayName = document.getElementById('staff-display').value.trim();
        
        if (!name) {
            this.showNotification('スタッフ名を入力してください', 'error');
            return;
        }

        try {
            const staffData = {
                name: name,
                display_name: displayName || name,
                active: true
            };

            const response = await fetch('tables/staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(staffData)
            });

            if (response.ok) {
                await this.loadStaff();
                this.hideStaffModal();
                this.showNotification('スタッフを追加しました', 'success');
            } else {
                throw new Error('スタッフの追加に失敗しました');
            }
        } catch (error) {
            console.error('スタッフ追加エラー:', error);
            this.showNotification('スタッフの追加に失敗しました', 'error');
        }
    }

    async toggleStaffActive(staffId) {
        try {
            const staff = this.staff.find(s => s.id === staffId);
            if (!staff) return;

            const response = await fetch(`tables/staff/${staffId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ active: !staff.active })
            });

            if (response.ok) {
                await this.loadStaff();
                this.showNotification(`スタッフのステータスを変更しました`, 'success');
            } else {
                throw new Error('ステータスの変更に失敗しました');
            }
        } catch (error) {
            console.error('ステータス変更エラー:', error);
            this.showNotification('ステータスの変更に失敗しました', 'error');
        }
    }

    async deleteStaff(staffId) {
        if (!confirm('このスタッフを削除しますか？関連するシフトも削除されます。')) return;

        try {
            const response = await fetch(`tables/staff/${staffId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadStaff();
                await this.loadShifts(); // シフトも再読み込み
                this.showNotification('スタッフを削除しました', 'success');
            } else {
                throw new Error('スタッフの削除に失敗しました');
            }
        } catch (error) {
            console.error('スタッフ削除エラー:', error);
            this.showNotification('スタッフの削除に失敗しました', 'error');
        }
    }

    updateStaffSelect() {
        const select = document.getElementById('shift-staff');
        if (!select) return;

        const activeStaff = this.staff.filter(staff => staff.active);
        
        select.innerHTML = '<option value="">スタッフを選択してください</option>' +
            activeStaff.map(staff => 
                `<option value="${staff.id}">${staff.display_name || staff.name}</option>`
            ).join('');
    }

    // シフト管理
    async handleShiftSubmit(e) {
        e.preventDefault();
        
        const staffId = document.getElementById('shift-staff').value;
        const date = document.getElementById('shift-date').value;
        const startTime = document.getElementById('shift-start').value;
        const endTime = document.getElementById('shift-end').value;
        const status = document.getElementById('shift-status').value;
        
        if (!staffId || !date || !startTime || !endTime) {
            this.showNotification('全ての項目を入力してください', 'error');
            return;
        }

        if (startTime >= endTime) {
            this.showNotification('終了時間は開始時間より後にしてください', 'error');
            return;
        }

        try {
            const shiftData = {
                staff_id: staffId,
                date: date,
                start_time: startTime,
                end_time: endTime,
                status: status
            };

            const response = await fetch('tables/shifts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(shiftData)
            });

            if (response.ok) {
                await this.loadShifts();
                document.getElementById('shift-form').reset();
                this.showNotification('シフトを登録しました', 'success');
            } else {
                throw new Error('シフトの登録に失敗しました');
            }
        } catch (error) {
            console.error('シフト登録エラー:', error);
            this.showNotification('シフトの登録に失敗しました', 'error');
        }
    }

    // 月の変更
    changeMonth(direction) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + direction);
        this.updateCurrentMonth();
        this.renderShiftsList();
    }

    updateCurrentMonth() {
        const monthElement = document.getElementById('current-month');
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

    renderShiftsList() {
        const container = document.getElementById('shifts-list');
        if (!container) return;

        const currentMonthShifts = this.getMonthShifts(this.currentMonth);
        
        if (currentMonthShifts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-calendar text-4xl mb-4"></i>
                    <p>この月のシフトはありません</p>
                </div>
            `;
            return;
        }

        // 日付順にソート
        currentMonthShifts.sort((a, b) => new Date(a.date) - new Date(b.date));

        container.innerHTML = currentMonthShifts.map(shift => {
            const staff = this.staff.find(s => s.id === shift.staff_id);
            const staffName = staff ? (staff.display_name || staff.name) : '不明なスタッフ';
            const statusText = this.getStatusText(shift.status);
            const statusClass = shift.status;

            return `
                <div class="shift-card ${statusClass} bg-white rounded-lg p-4 border">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center mb-2">
                                <i class="fas fa-user text-gray-500 mr-2"></i>
                                <span class="font-medium text-gray-900">${staffName}</span>
                                <span class="badge ${statusClass} ml-2">${statusText}</span>
                            </div>
                            <div class="flex items-center text-sm text-gray-600">
                                <i class="fas fa-calendar mr-2"></i>
                                <span>${this.formatDate(shift.date)}</span>
                                <i class="fas fa-clock ml-4 mr-2"></i>
                                <span>${shift.start_time} - ${shift.end_time}</span>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button onclick="shiftSystem.editShift('${shift.id}')" class="text-gray-500 hover:text-gray-700">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="shiftSystem.deleteShift('${shift.id}')" class="text-red-500 hover:text-red-700">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getMonthShifts(targetMonth) {
        const year = targetMonth.getFullYear();
        const month = targetMonth.getMonth();
        
        return this.shifts.filter(shift => {
            const shiftDate = new Date(shift.date);
            return shiftDate.getFullYear() === year && shiftDate.getMonth() === month;
        });
    }

    async deleteShift(shiftId) {
        if (!confirm('このシフトを削除しますか？')) return;

        try {
            const response = await fetch(`tables/shifts/${shiftId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadShifts();
                this.showNotification('シフトを削除しました', 'success');
            } else {
                throw new Error('シフトの削除に失敗しました');
            }
        } catch (error) {
            console.error('シフト削除エラー:', error);
            this.showNotification('シフトの削除に失敗しました', 'error');
        }
    }

    // ユーティリティメソッド
    getStatusText(status) {
        switch (status) {
            case 'confirmed': return '確定';
            case 'scheduled': return '予定';
            case 'cancelled': return 'キャンセル';
            default: return '不明';
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', { 
            month: 'short', 
            day: 'numeric',
            weekday: 'short'
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${this.getNotificationIcon(type)} mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }
}

// グローバル変数として初期化
let shiftSystem;

// DOMの読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
    shiftSystem = new ShiftManagementSystem();
});
