import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminQuizService } from '../../../core/services/admin-quiz.service';
import { MemberQuizService } from '../../../core/services/member-quiz.service';
import { OptionItem, QuestionDraft, QuestionType, QuizSaveRequest, getQuestionTypeLabel } from '../../../core/models/survey.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-edit',
  template: `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">{{ isEditMode ? '編輯問卷' : '新增問卷' }}</h1>
        <button class="btn btn-outline" (click)="onReturnToList()">回列表</button>
      </div>

      <!-- Wizard Header Tabs -->
      <div class="tabs-header">
        <button class="tab-btn" [class.active]="currentTab === 1" (click)="switchTab(1)">1. 問卷基本設定</button>
        <button class="tab-btn" [class.active]="currentTab === 2" (click)="switchTab(2)">2. 題目設計</button>
        <button class="tab-btn" [class.active]="currentTab === 3" (click)="switchTab(3)">3. 題目確認與儲存</button>
      </div>

      <div *ngIf="errorMessage" style="color: #ef4444; font-weight: 600; margin-bottom: 16px; background: #fee2e2; padding: 10px 16px; border-radius: 6px;">
        {{ errorMessage }}
      </div>

      <!-- TAB 1: SURVEY INFORMATION -->
      <div *ngIf="currentTab === 1" class="card">
        <h3 style="font-size: 1.1rem; margin-bottom: 20px; color: #1e293b;">問卷內容相關設定</h3>

        <div style="display: flex; flex-direction: column; gap: 16px; max-width: 680px;">
          <div class="form-group">
            <label>問卷名稱 <span style="color: #ef4444;">*</span></label>
            <input type="text" class="form-control" [(ngModel)]="name" (ngModelChange)="clearFieldError('name')" placeholder="請輸入問卷名稱" />
            <div class="field-error" *ngIf="fieldErrors['name']">{{ fieldErrors['name'] }}</div>
          </div>

          <div class="form-group">
            <label>問卷說明 <span style="color: #ef4444;">*</span></label>
            <textarea class="form-control" [(ngModel)]="description" (ngModelChange)="clearFieldError('description')" placeholder="請輸入問卷詳細說明與注意事項..."></textarea>
            <div class="field-error" *ngIf="fieldErrors['description']">{{ fieldErrors['description'] }}</div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label>開始時間 <span style="color: #ef4444;">*</span></label>
              <input type="date" class="form-control" [(ngModel)]="startDate" (ngModelChange)="clearFieldError('startDate')" />
              <div class="field-error" *ngIf="fieldErrors['startDate']">{{ fieldErrors['startDate'] }}</div>
            </div>

            <div class="form-group">
              <label>結束時間 <span style="color: #ef4444;">*</span></label>
              <input type="date" class="form-control" [(ngModel)]="endDate" (ngModelChange)="clearFieldError('endDate')" />
              <div class="field-error" *ngIf="fieldErrors['endDate']">{{ fieldErrors['endDate'] }}</div>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;">
          <button class="btn btn-outline" (click)="onReturnToList()">取消</button>
          <button class="btn btn-primary" (click)="goToTab2()">下一步 (題目設計) &raquo;</button>
        </div>
      </div>

      <!-- TAB 2: QUESTION DESIGN -->
      <div *ngIf="currentTab === 2">
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 1.1rem; color: #1e293b;">設計問題與選項</h3>
            <button class="btn btn-primary" (click)="openAddQuestionModal()">➕ 新增問題</button>
          </div>

          <!-- Questions Table -->
          <div class="table-responsive" style="margin-bottom: 20px;">
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">
                    <input type="checkbox" [checked]="isAllQuestionsSelected()" (change)="toggleSelectAllQuestions()" />
                  </th>
                  <th>內容 (問題名稱)</th>
                  <th style="width: 100px;">種類</th>
                  <th style="width: 80px; text-align: center;">必填</th>
                  <th style="width: 100px; text-align: center;">編輯</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let q of questions; let i = index">
                  <td style="text-align: center;">
                    <input type="checkbox" [checked]="selectedQuestionIndices.includes(i)" (change)="toggleSelectQuestion(i)" />
                  </td>
                  <td>{{ q.questName }}</td>
                  <td>{{ getTypeLabel(q.type) }}</td>
                  <td style="text-align: center;">
                    <input type="checkbox" [checked]="q.need" disabled />
                  </td>
                  <td style="text-align: center;">
                    <button class="btn btn-outline" style="padding: 2px 8px; font-size: 0.8rem;" (click)="editQuestion(i)">
                      編輯
                    </button>
                  </td>
                </tr>
                <tr *ngIf="questions.length === 0">
                  <td colspan="5" style="text-align: center; color: #94a3b8; padding: 32px;">
                    尚無建立任何問題，請點擊右上角「新增問題」按鈕。
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <button class="btn btn-danger" (click)="deleteSelectedQuestions()" [disabled]="selectedQuestionIndices.length === 0">
              🗑️ 刪除標示問題 ({{ selectedQuestionIndices.length }})
            </button>
            <div style="display: flex; gap: 12px;">
              <button class="btn btn-outline" (click)="switchTab(1)">&laquo; 上一步</button>
              <button class="btn btn-primary" (click)="goToTab3()">下一步 (預覽確認) &raquo;</button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: CONFIRMATION & PUBLISH/SAVE DRAFT -->
      <div *ngIf="currentTab === 3" class="card">
        <h3 style="font-size: 1.1rem; margin-bottom: 16px; color: #1e293b;">問卷全覽預覽 (題目確認頁)</h3>

        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
          <h2 style="font-size: 1.3rem; font-weight: 700; color: #0f172a;">{{ name }}</h2>
          <p style="color: #64748b; margin-top: 4px;">{{ description }}</p>
          <div style="margin-top: 8px; font-size: 0.85rem; color: #475569;">
            預定開放期間：<strong>{{ startDate }}</strong> 至 <strong>{{ endDate }}</strong>
          </div>
        </div>

        <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 16px; color: #334155;">題目與選項清單 ({{ questions.length }} 題)</h4>

        <div *ngFor="let q of questions; let i = index" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">
            {{ i + 1 }}. {{ q.questName }}
            <span *ngIf="q.need" style="color: #ef4444; font-size: 0.85rem;">(必填)</span>
            <span style="font-weight: 400; font-size: 0.85rem; color: #64748b; margin-left: 8px;">
              [{{ getTypeLabel(q.type) }}]
            </span>
          </div>

          <div *ngIf="q.type !== 'T'" style="padding-left: 12px;">
            <div *ngFor="let opt of q.options" style="color: #475569; font-size: 0.9rem; margin-bottom: 4px;">
              • {{ opt.optionName }}
            </div>
          </div>
          <div *ngIf="q.type === 'T'" style="padding-left: 12px; color: #94a3b8; font-style: italic; font-size: 0.9rem;">
            [使用者簡答輸入框]
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 32px;">
          <button class="btn btn-outline" (click)="switchTab(2)">&laquo; 回上一步修改</button>

          <div style="display: flex; gap: 12px;">
            <button class="btn btn-secondary" (click)="onSave(false)" [disabled]="saving">
              💾 僅儲存 (存草稿)
            </button>
            <button class="btn btn-primary" (click)="onSave(true)" [disabled]="saving">
              🚀 儲存並發佈
            </button>
          </div>
        </div>
      </div>

      <!-- QUESTION EDIT/ADD MODAL DIALOG -->
      <div class="modal-backdrop" *ngIf="showQuestionModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">{{ editingQuestionIndex !== null ? '編輯問題' : '新增問題' }}</h3>
            <button class="modal-close" (click)="closeQuestionModal()">&times;</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div class="form-group">
              <label>問題名稱 <span style="color: #ef4444;">*</span></label>
              <input type="text" class="form-control" [(ngModel)]="modalQuestName" placeholder="請輸入問題標題..." />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="form-group">
                <label>題型種類</label>
                <select class="form-control" [(ngModel)]="modalType">
                  <option value="Q">單選 (Q)</option>
                  <option value="M">多選 (M)</option>
                  <option value="T">文字 (T)</option>
                </select>
              </div>

              <div class="form-group" style="justify-content: flex-end;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; height: 38px;">
                  <input type="checkbox" [(ngModel)]="modalNeed" /> 是否必填
                </label>
              </div>
            </div>

            <!-- Options Section for Choice Questions (Q/M) -->
            <div *ngIf="modalType !== 'T'" style="margin-top: 8px;">
              <label style="font-weight: 600; color: #475569; font-size: 0.9rem; margin-bottom: 8px; display: block;">
                選項列表 (目前 {{ modalOptions.length }} 個選項)
              </label>

              <div *ngFor="let opt of modalOptions; let optIdx = index" class="option-input-row">
                <span class="option-number">{{ optIdx + 1 }}.</span>
                <input type="text" class="form-control" [(ngModel)]="opt.optionName" placeholder="選項內容" />
                <button class="btn btn-outline" style="padding: 4px 8px; color: #ef4444;" (click)="removeModalOption(optIdx)" [disabled]="modalOptions.length <= 1">
                  ✕
                </button>
              </div>

              <button class="btn btn-outline" style="width: 100%; margin-top: 8px;" (click)="addModalOption()">
                ➕ 新增選項
              </button>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeQuestionModal()">取消</button>
            <button class="btn btn-primary" (click)="saveQuestionModal()">確定保存</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminEditComponent implements OnInit {
  quizId?: number;
  isEditMode = false;
  currentTab = 1;

  name = '';
  description = '';
  startDate = new Date().toISOString().split('T')[0];
  endDate = new Date().toISOString().split('T')[0];

  questions: QuestionDraft[] = [];
  selectedQuestionIndices: number[] = [];

  // Modal State
  showQuestionModal = false;
  editingQuestionIndex: number | null = null;
  modalQuestName = '';
  modalType: QuestionType = 'Q';
  modalNeed = false;
  modalOptions: OptionItem[] = [];

  errorMessage = '';
  fieldErrors: Record<string, string> = {};
  saving = false;

  getTypeLabel = getQuestionTypeLabel;

  clearFieldError(field: string): void {
    if (this.fieldErrors[field]) {
      delete this.fieldErrors[field];
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminQuizService: AdminQuizService,
    private memberQuizService: MemberQuizService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.quizId = +idParam;
      this.isEditMode = true;
      this.loadExistingQuiz();
    }
  }

  loadExistingQuiz(): void {
    if (!this.quizId) return;
    this.adminQuizService.getManagedQuizDetail(this.quizId, this.auth.isAdmin).subscribe({
      next: res => {
        if (res.success && res.data) {
          const q = res.data;
          this.name = q.name;
          this.description = q.description;
          this.startDate = q.startDate;
          this.endDate = q.endDate;
          this.questions = q.questions || [];
        }
      },
      error: err => {
        this.errorMessage = err.status === 403 ? '您沒有權限管理此問卷。' : (err.error?.message || '問卷載入失敗。');
      }
    });
  }

  switchTab(tab: number): void {
    this.errorMessage = '';
    if ((tab === 2 || tab === 3) && !this.validateTab1()) {
      return;
    }
    this.currentTab = tab;
  }

  validateTab1(): boolean {
    this.errorMessage = '';
    this.fieldErrors = {};

    if (!this.name || !this.name.trim()) {
      this.fieldErrors['name'] = '請填寫問卷名稱！';
    }
    if (!this.description || !this.description.trim()) {
      this.fieldErrors['description'] = '請填寫問卷說明！';
    }
    if (!this.startDate) {
      this.fieldErrors['startDate'] = '請選擇開始時間！';
    }
    if (!this.endDate) {
      this.fieldErrors['endDate'] = '請選擇結束時間！';
    }
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      this.fieldErrors['endDate'] = '問卷結束的時間不能比開始的時間還要早，請重新選擇時間!!';
    }

    if (Object.keys(this.fieldErrors).length > 0) {
      this.errorMessage = '基本設定資料有誤或不完整，請檢查並修正欄位後再繼續！';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    return true;
  }

  goToTab2(): void {
    if (this.validateTab1()) {
      this.currentTab = 2;
    }
  }

  goToTab3(): void {
    if (this.validateTab1()) {
      if (this.questions.length === 0) {
        if (!confirm('目前問卷尚未設計任何題目，確定要前往預覽確認頁嗎？')) {
          return;
        }
      }
      this.currentTab = 3;
    }
  }

  // Question Modal Management
  openAddQuestionModal(): void {
    this.editingQuestionIndex = null;
    this.modalQuestName = '';
    this.modalType = 'Q';
    this.modalNeed = false;
    this.modalOptions = [
      { optionName: '', code: 0 },
      { optionName: '', code: 1 }
    ];
    this.showQuestionModal = true;
  }

  editQuestion(index: number): void {
    this.editingQuestionIndex = index;
    const q = this.questions[index];
    this.modalQuestName = q.questName;
    this.modalType = q.type;
    this.modalNeed = q.need;
    this.modalOptions = (q.options || []).map(opt => ({ ...opt }));
    if (this.modalType !== 'T' && this.modalOptions.length === 0) {
      this.modalOptions = [
        { optionName: '', code: 0 },
        { optionName: '', code: 1 }
      ];
    }
    this.showQuestionModal = true;
  }

  closeQuestionModal(): void {
    this.showQuestionModal = false;
  }

  addModalOption(): void {
    this.modalOptions.push({ optionName: '', code: this.modalOptions.length });
  }

  removeModalOption(idx: number): void {
    if (this.modalOptions.length > 1) {
      this.modalOptions.splice(idx, 1);
    }
  }

  saveQuestionModal(): void {
    if (!this.modalQuestName.trim()) {
      alert('請填寫問題名稱！');
      return;
    }

    let cleanedOptions: OptionItem[] = [];
    if (this.modalType !== 'T') {
      cleanedOptions = this.modalOptions
        .filter(o => o.optionName.trim().length > 0)
        .map((o, idx) => ({ optionName: o.optionName.trim(), code: idx }));

      if (cleanedOptions.length === 0) {
        alert('選擇題型至少需要填寫一個有效選項！');
        return;
      }
    }

    const questionItem: QuestionDraft = {
      questId: this.editingQuestionIndex !== null ? this.questions[this.editingQuestionIndex].questId : undefined,
      questName: this.modalQuestName.trim(),
      type: this.modalType,
      need: this.modalNeed,
      options: cleanedOptions
    };

    if (this.editingQuestionIndex !== null) {
      this.questions[this.editingQuestionIndex] = questionItem;
    } else {
      this.questions.push(questionItem);
    }

    this.closeQuestionModal();
  }

  // Question Selection and Deletion
  toggleSelectQuestion(index: number): void {
    const pos = this.selectedQuestionIndices.indexOf(index);
    if (pos >= 0) {
      this.selectedQuestionIndices.splice(pos, 1);
    } else {
      this.selectedQuestionIndices.push(index);
    }
  }

  isAllQuestionsSelected(): boolean {
    return this.questions.length > 0 && this.selectedQuestionIndices.length === this.questions.length;
  }

  toggleSelectAllQuestions(): void {
    if (this.isAllQuestionsSelected()) {
      this.selectedQuestionIndices = [];
    } else {
      this.selectedQuestionIndices = this.questions.map((_, i) => i);
    }
  }

  deleteSelectedQuestions(): void {
    if (this.selectedQuestionIndices.length === 0) return;
    this.questions = this.questions.filter((_, idx) => !this.selectedQuestionIndices.includes(idx));
    this.selectedQuestionIndices = [];
  }

  // Final Save to DB
  onSave(isPublished: boolean): void {
    if (!this.validateTab1()) return;

    this.saving = true;
    this.errorMessage = '';

    const payload: QuizSaveRequest = {
      id: this.quizId,
      name: this.name.trim(),
      description: this.description.trim(),
      startDate: this.startDate,
      endDate: this.endDate,
      isPublished: isPublished,
      questions: this.questions
    };

    const request$ = this.auth.isAdmin
      ? this.adminQuizService.saveOrUpdateQuiz(payload)
      : this.memberQuizService.createMemberQuiz(payload);

    request$.subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          alert(isPublished ? '問卷已成功儲存並發佈！' : '問卷草稿已成功儲存！');
          this.router.navigate([this.auth.managementBase]);
        } else {
          this.errorMessage = res.message || '儲存失敗！';
        }
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.message || '系統錯誤，儲存失敗！';
      }
    });
  }

  onReturnToList(): void {
    this.router.navigate([this.auth.managementBase]);
  }
}
