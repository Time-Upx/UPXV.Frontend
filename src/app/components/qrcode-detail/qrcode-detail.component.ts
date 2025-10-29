import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { QRCodeService, QRCode, QRCodeUpdateDTO, QRCodeExportDTO } from '../../services/qrcode.service';
import { IntentService, Intent } from '../../services/intent.service';
import { ModalService, ModalActionItem } from '../../services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-qrcode-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './qrcode-detail.component.html',
  styleUrls: ['./qrcode-detail.component.css']
})
export class QRCodeDetailComponent implements OnInit, OnDestroy {
  item: QRCode = {} as QRCode;
  intents: Intent[] = [];
  carregando = true;
  editMode = false;
  formSubmitted = false;
  editForm: FormGroup;
  qrCodeImage: string = '';
  mostrandoQrCode = false;
  carregandoExport = false;

  // Mensagens
  mensagemErro = '';
  mensagemSucesso = '';

  private subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private qrService: QRCodeService,
    private intentService: IntentService,
    private modalService: ModalService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      intentId: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      password: [''],
      usageLimit: [null, [Validators.min(1)]],
      intentArguments: ['']
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadItem(+id);
      this.loadIntents();
    } else {
      this.router.navigate(['/qrcodes']);
    }

    this.subscription.add(
      this.modalService.onConfirm().subscribe((item: ModalActionItem) => {
        if (item.type === 'qrcode' && item.nid === this.item.id) {
          this.deletar(item.nid);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadItem(id: number) {
    this.carregando = true;
    this.qrService.getById(id).subscribe({
      next: (data) => {
        this.item = data;
        this.populateEditForm();
        this.carregando = false;
      },
      error: () => {
        this.mensagemErro = 'Erro ao carregar QRCode.';
        setTimeout(() => this.router.navigate(['/qrcodes']), 2000);
      }
    });
  }

  loadIntents() {
    this.intentService.listar().subscribe({
      next: (intents) => this.intents = intents,
      error: () => this.mensagemErro = 'Erro ao carregar intents.'
    });
  }

  populateEditForm() {
    this.editForm.patchValue({
      intentId: this.item.intent.id,
      name: this.item.name,
      description: this.item.description,
      password: this.item.password,
      usageLimit: this.item.usageLimit,
      intentArguments: this.item.arguments ? JSON.stringify(this.item.arguments, null, 2) : ''
    });
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.populateEditForm();
      this.mensagemErro = '';
      this.mensagemSucesso = '';
    } else {
      this.formSubmitted = false;
    }
  }

  atualizar() {
    this.formSubmitted = true;
    if (this.editForm.valid) {
      let args: Record<string, string> = {};
      try {
        if (this.editForm.value.intentArguments) {
          args = JSON.parse(this.editForm.value.intentArguments);
        }
      } catch {
        this.mensagemErro = 'Argumentos JSON inválidos.';
        setTimeout(() => this.mensagemErro = '', 5000);
        return;
      }

      const payload: QRCodeUpdateDTO = {
        intentId: +this.editForm.value.intentId,
        name: this.editForm.value.name,
        description: this.editForm.value.description,
        password: this.editForm.value.password || undefined,
        usageLimit: this.editForm.value.usageLimit || undefined,
        intentArguments: Object.keys(args).length ? args : undefined
      };

      this.qrService.atualizar(this.item.id, payload).subscribe({
        next: (updated) => {
          this.item = updated;
          this.mensagemSucesso = 'QRCode atualizado com sucesso!';
          this.toggleEdit();
          setTimeout(() => this.mensagemSucesso = '', 3000);
        },
        error: (err) => {
          this.mensagemErro = err.error?.message || 'Erro ao atualizar QRCode.';
          setTimeout(() => this.mensagemErro = '', 5000);
        }
      });
    }
  }

  exportarQR() {
    this.carregandoExport = true;
    this.mensagemErro = '';
    const config: QRCodeExportDTO = { width: 500, height: 500, margin: 2 };
    this.qrService.exportImage(this.item.id, config).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.qrCodeImage = url;
        this.mostrandoQrCode = true;
        this.carregandoExport = false;
        this.mensagemSucesso = 'Imagem exportada com sucesso!';
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: () => {
        this.mensagemErro = 'Falha ao exportar imagem.';
        this.carregandoExport = false;
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }

  fecharQrCode() {
    this.mostrandoQrCode = false;
    if (this.qrCodeImage) URL.revokeObjectURL(this.qrCodeImage);
    this.qrCodeImage = '';
  }

  imprimirQrCode() {
    if (!this.qrCodeImage) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QRCode - ${this.item.name}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
              img { max-width: 300px; margin: 20px 0; }
            </style>
          </head>
          <body onload="window.print(); window.close()">
            <h2>${this.item.name}</h2>
            <img src="${this.qrCodeImage}" />
            <p><small>${this.item.url}</small></p>
          </body>
        </html>
      `);
      win.document.close();
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
        this.mensagemSucesso = 'QRCode excluído com sucesso!';
        setTimeout(() => this.router.navigate(['/qrcodes']), 1500);
      },
      error: () => {
        this.mensagemErro = 'Erro ao excluir QRCode.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }
}