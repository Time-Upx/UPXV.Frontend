import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsumableService } from '../../services/consumable.service';
import { ModalService } from '../../services/modal.service';
import { UtilsService } from '../../services/utils.service';
import QRCode from 'qrcode';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-consumable-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './consumable-detail.component.html',
  styleUrls: ['./consumable-detail.component.css']
})
export class ConsumableDetailComponent implements OnInit, OnDestroy {
  item: any = {};
  carregando = true;
  qrCodeUrl = '';
  mostrandoQrCode = false;
  baseUrl = window.location.origin;
  editMode = false;
  mensagemErro = '';
  mensagemSucesso = '';
  carregandoEdit = false;
  formSubmitted = false;
  editForm: FormGroup;
  units: any[] = [];
  tags: any[] = [];
  showAddTagInput = false;
  newTagTid = '';
  newTagDescription = '';
  carregandoTag = false;
  selectedTagNids: number[] = [];

  utilsService: UtilsService = inject(UtilsService);

  private subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: ConsumableService,
    private modalService: ModalService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      tid: ['', Validators.required],
      description: [''],
      quantity: [0, [Validators.required, Validators.min(0)]],
      unitNid: ['', Validators.required]
    });
  }

  ngOnInit() {
    const nid = this.route.snapshot.paramMap.get('nid');
    if (nid) {
      this.loadItem(+nid);
      this.loadUnits();
      this.loadTags();
    } else {
      this.router.navigate(['/consumable']);
    }

    this.subscription.add(
      this.modalService.onConfirm().subscribe(item => {
        if (item.type === 'consumable' && item.nid === this.item.nid) {
          this.deletar(item.nid);
        } else if (item.type === 'tag') {
          this.deletarTag(item.nid.toString());
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadItem(nid: number) {
    this.service.getById(nid).subscribe({
      next: (data) => {
        this.item = data;
        this.selectedTagNids = data.tags?.map((tag: any) => tag.nid) || [];
        this.populateEditForm();
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar:', err);
        this.mensagemErro = 'Erro ao carregar item.';
        setTimeout(() => this.router.navigate(['/consumable']), 2000);
      }
    });
  }

  loadUnits() {
    this.utilsService.listarUnits().subscribe({
      next: (data: any) => this.units = data.items || data,
      error: () => this.units = []
    });
  }

  loadTags() {
    this.utilsService.listarTags().subscribe({
      next: (data: any) => {
        this.tags = data.items || data;
      },
      error: () => {
        this.mensagemErro = 'Erro ao carregar tags.';
        this.tags = [];
      }
    });
  }

  populateEditForm() {
    if (this.item) {
      this.editForm.patchValue({
        tid: this.item.tid || '',
        description: this.item.description || '',
        quantity: this.item.quantity || 0,
        unitNid: this.item.unit.nid || ''
      });
    }
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.populateEditForm();
    } else {
      this.formSubmitted = false;
      this.mensagemErro = '';
      this.mensagemSucesso = '';
      this.showAddTagInput = false;
    }
  }

  atualizar() {
    this.formSubmitted = true;
    if (this.editForm.valid) {
      this.carregandoEdit = true;
      const payload = {
        nid: this.item.nid,
        ...this.editForm.value,
        tagNids: this.selectedTagNids
      };

      this.service.atualizar(payload).subscribe({
        next: (response) => {
          this.item = { ...this.item, ...response };
          this.mensagemSucesso = 'Consumível atualizado!';
          this.toggleEdit();
          setTimeout(() => this.mensagemSucesso = '', 3000);
        },
        error: (err) => {
          this.mensagemErro = err.error?.message || 'Erro ao atualizar.';
          setTimeout(() => this.mensagemErro = '', 5000);
        },
        complete: () => this.carregandoEdit = false
      });
    }
  }

  toggleAddTagInput() {
    this.showAddTagInput = !this.showAddTagInput;
    if (!this.showAddTagInput) {
      this.newTagTid = '';
      this.newTagDescription = '';
    }
  }

  adicionarTag() {
    const tidTrimmed = this.newTagTid.trim();
    if (!tidTrimmed) {
      this.mensagemErro = 'Título é obrigatório.';
      setTimeout(() => this.mensagemErro = '', 3000);
      return;
    }

    const exists = this.tags.some(tag => tag.tid.toLowerCase() === tidTrimmed.toLowerCase());
    if (exists) {
      this.mensagemErro = 'Tag com este título já existe.';
      setTimeout(() => this.mensagemErro = '', 3000);
      return;
    }

    this.carregandoTag = true;
    const payload = {
      tid: tidTrimmed,
      description: this.newTagDescription.trim() || ''
    };
    this.utilsService.adicionarTag(payload).subscribe({
      next: () => {
        this.mensagemSucesso = 'Tag adicionada!';
        this.loadTags();
        this.toggleAddTagInput();
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: (err) => {
        this.mensagemErro = err.error?.message || 'Erro ao adicionar tag.';
        setTimeout(() => this.mensagemErro = '', 5000);
      },
      complete: () => this.carregandoTag = false
    });
  }

  confirmarDeletarTag(nid: number, tid: string) {
    this.modalService.showConfirmation(
      'Excluir Tag',
      `Deseja excluir a tag "${tid}"?`,
      { nid, tid, type: 'tag' }
    );
  }

  deletarTag(nid: string) {
    this.utilsService.deletarTag(nid).subscribe({
      next: () => {
        this.mensagemSucesso = 'Tag excluída!';
        this.loadTags();
        this.selectedTagNids = this.selectedTagNids.filter(id => id.toString() !== nid);
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: (err) => {
        this.mensagemErro = 'Erro ao excluir tag.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }

  toggleAssignTag(tagId: number) {
    if (this.selectedTagNids.includes(tagId)) {
      this.selectedTagNids = this.selectedTagNids.filter(id => id !== tagId);
    } else {
      this.selectedTagNids.push(tagId);
    }
  }

  isAssigned(tagId: number): boolean {
    return this.selectedTagNids.includes(tagId);
  }

  gerarQrCode() {
    const link = `${this.baseUrl}/consumable/${this.item.nid}`;
    QRCode.toDataURL(link, {
      width: 300,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'H'
    }).then(url => {
      this.qrCodeUrl = url;
      this.mostrandoQrCode = true;
    }).catch(err => console.error('Erro QR:', err));
  }

  fecharQrCode() {
    this.mostrandoQrCode = false;
    this.qrCodeUrl = '';
  }

  imprimirQrCode() {
    if (!this.qrCodeUrl) return;
    const printContent = `
      <!DOCTYPE html>
      <html><head><title>QR Code - ${this.item.tid}</title>
      <style>body { font-family: Arial; text-align: center; padding: 20px; } img { max-width: 200px; }</style></head>
      <body onload="window.print(); window.close()">
        <h2>${this.item.tid}</h2>
        <img src="${this.qrCodeUrl}" />
        <p>${this.baseUrl}/consumable/${this.item.nid}</p>
      </body></html>
    `;
    const win = window.open('', '_blank');
    win?.document.write(printContent);
    win?.document.close();
  }

  confirmarDeletar(nid: number, tid: string) {
    this.modalService.showConfirmation(
      'Excluir Consumível',
      `Deseja realmente excluir "${tid}"?`,
      { nid, tid, type: 'consumable' }
    );
  }

  deletar(nid: number) {
    this.service.deletar(nid).subscribe({
      next: () => this.router.navigate(['/consumable']),
      error: (err) => {
        console.error('Erro ao deletar:', err);
        this.mensagemErro = 'Erro ao deletar.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }
}