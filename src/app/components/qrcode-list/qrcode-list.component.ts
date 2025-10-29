import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { QRCodeService, QRCode, QRCodeCreateDTO } from '../../services/qrcode.service';
import { IntentService, Intent } from '../../services/intent.service';
import { ModalService, ModalActionItem } from '../../services/modal.service';
import { PageDTO } from '../../services/utils.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-qrcode-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './qrcode-list.component.html',
  styleUrls: ['./qrcode-list.component.css']
})
export class QRCodeListComponent implements OnInit, OnDestroy {
  qrcodes: QRCode[] = [];
  intents: Intent[] = [];
  formVisible = false;
  mensagemErro = '';
  mensagemSucesso = '';
  formSubmitted = false;
  carregandoForm = false;
  formGroup: FormGroup;

  // Paginação
  currentPageIndex = 0;
  pageSize = 12;
  totalCount = 0;
  totalPages = 0;
  pageNumbers: number[] = [];

  private subscription = new Subscription();

  constructor(
    private qrService: QRCodeService,
    private intentService: IntentService,
    private fb: FormBuilder,
    private modalService: ModalService
  ) {
    this.formGroup = this.fb.group({
      intentId: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      expiration: [''],
      password: [''],
      usageLimit: [null, [Validators.min(1)]],
      intentArguments: ['']
    });
  }

  ngOnInit() {
    this.loadQRCodes();
    this.loadIntents();

    this.subscription.add(
      this.modalService.onConfirm().subscribe((item: ModalActionItem) => {
        if (item.type === 'qrcode') {
          this.deletar(item.nid);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadQRCodes() {
    this.qrService.listar(this.currentPageIndex, this.pageSize).subscribe({
      next: (page: PageDTO<QRCode>) => {
        this.qrcodes = page.items;
        this.totalCount = page.totalCount;
        this.totalPages = page.totalPages;
        this.updatePageNumbers();
      },
      error: () => {
        this.mensagemErro = 'Erro ao carregar QRCodes.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }

  loadIntents() {
    this.intentService.listar().subscribe({
      next: (intents) => this.intents = intents,
      error: () => this.mensagemErro = 'Erro ao carregar intents.'
    });
  }

  updatePageNumbers() {
    const maxVisible = 5;
    const pages: number[] = [];
    if (this.totalPages <= maxVisible) {
      for (let i = 0; i < this.totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(0, this.currentPageIndex - 2);
      const end = Math.min(this.totalPages, start + maxVisible);
      if (start > 0) pages.push(0);
      if (start > 1) pages.push(-1);
      for (let i = start; i < end; i++) pages.push(i);
      if (end < this.totalPages - 1) pages.push(-1);
      if (end < this.totalPages) pages.push(this.totalPages - 1);
    }
    this.pageNumbers = pages;
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages && page !== this.currentPageIndex) {
      this.currentPageIndex = page;
      this.loadQRCodes();
    }
  }

  toggleForm() {
    this.formVisible = !this.formVisible;
    if (!this.formVisible) {
      this.formGroup.reset();
      this.formSubmitted = false;
    }
  }

  criar() {
    this.formSubmitted = true;
    if (this.formGroup.valid) {
      this.carregandoForm = true;
      let args: Record<string, string> = {};
      try {
        if (this.formGroup.value.intentArguments) {
          args = JSON.parse(this.formGroup.value.intentArguments);
        }
      } catch {
        this.mensagemErro = 'Argumentos inválidos (JSON).';
        this.carregandoForm = false;
        return;
      }

      const payload: QRCodeCreateDTO = {
        intentId: +this.formGroup.value.intentId,
        name: this.formGroup.value.name,
        description: this.formGroup.value.description,
        expiration: this.formGroup.value.expiration || undefined,
        password: this.formGroup.value.password || undefined,
        usageLimit: this.formGroup.value.usageLimit || undefined,
        intentArguments: Object.keys(args).length ? args : undefined
      };

      this.qrService.criar(payload).subscribe({
        next: () => {
          this.mensagemSucesso = 'QRCode criado com sucesso!';
          this.loadQRCodes();
          this.toggleForm();
          setTimeout(() => this.mensagemSucesso = '', 3000);
        },
        error: (err) => {
          this.mensagemErro = err.error?.message || 'Erro ao criar QRCode.';
          setTimeout(() => this.mensagemErro = '', 5000);
        },
        complete: () => this.carregandoForm = false
      });
    }
  }

  confirmarDeletar(id: number, name: string) {
    this.modalService.showConfirmation(
      'Excluir QRCode',
      `Deseja realmente excluir "<strong>${name}</strong>"?`,
      { nid: id, name: name, type: 'qrcode' }
    );
  }

  deletar(id: number) {
    this.qrService.deletar(id).subscribe({
      next: () => {
        this.mensagemSucesso = 'QRCode excluído!';
        this.loadQRCodes();
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: () => {
        this.mensagemErro = 'Erro ao excluir QRCode.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }
}