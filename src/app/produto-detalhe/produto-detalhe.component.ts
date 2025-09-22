import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProdutoService } from '../services/produto.service';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import QRCode from 'qrcode';

@Component({
  selector: 'app-produto-detalhe',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './produto-detalhe.component.html',
  styleUrls: ['./produto-detalhe.component.css']
})
export class ProdutoDetalheComponent implements OnInit {
  produto: any = {};
  carregando: boolean = true;
  mensagemErro: string = '';
  isDono: boolean = false;
  qrCodeUrl: string = '';
  baseUrl: string = window.location.origin; // URL dinâmica
  mostrandoQrCode: boolean = false;

  authService: AuthService = inject(AuthService);
  router: Router = inject(Router);

  constructor(
    private route: ActivatedRoute,
    private produtoService: ProdutoService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.produtoService.getProdutoById(+id).subscribe({
        next: (data) => {
          this.produto = data;
          this.produto.tagsDisplay = this.processarTags(data.tags);
          this.carregando = false;
          this.verificarDono();
        },
        error: (err) => {
          this.mensagemErro = 'Produto não encontrado ou erro ao carregar.';
          this.carregando = false;
        }
      });
    } else {
      this.mensagemErro = 'ID do produto não fornecido.';
      this.carregando = false;
    }
  }

  processarTags(tags: string): string {
    if (tags) {
      try {
        return JSON.parse(tags).join(', ');
      } catch (e) {
        return tags;
      }
    }
    return 'Nenhuma tag';
  }

  verificarDono() {
    if (this.authService.isLoggedIn()) {
      // Assumindo que o backend retorna 'usuario_id' no produto
      const usuarioId = this.authService.getUsuarioId(); // Implemente esse método no AuthService
      this.isDono = this.produto.usuario_id === usuarioId;
    }
  }

  // GERAÇÃO DE QR CODE
  gerarQrCode(): void {
    if (!this.produto.id) {
      this.mensagemErro = 'Erro: ID do produto não disponível.';
      return;
    }

    const linkProduto = `${this.baseUrl}/produto/detalhes/${this.produto.id}`;
    console.log('Gerando QR Code para:', linkProduto);

    QRCode.toDataURL(linkProduto, {
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // Alta correção de erro
    }).then((url) => {
      this.qrCodeUrl = url;
      this.mostrandoQrCode = true;
      console.log('QR Code gerado com sucesso');
    }).catch((err) => {
      console.error('Erro ao gerar QR Code:', err);
      this.mensagemErro = 'Erro ao gerar QR Code. Verifique sua conexão.';
    });
  }

  imprimirQrCode(): void {
    if (!this.qrCodeUrl) {
      this.gerarQrCode();
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>QR Code - ${this.produto.nome}</title>
        <style>
          @page { 
            margin: 20mm; 
            size: A4;
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; 
            padding: 40px; 
            background: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .header { 
            margin-bottom: 30px; 
            width: 100%;
          }
          .header h1 { 
            color: #1f2937; 
            margin-bottom: 10px;
            font-size: 24px;
            font-weight: 600;
          }
          .header p { 
            color: #6b7280; 
            margin: 0;
            font-size: 14px;
          }
          .qr-container { 
            background: white; 
            padding: 30px; 
            border-radius: 12px; 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
          .qr-code { 
            max-width: 200px;
            max-height: 200px;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
          }
          .info { 
            text-align: center;
            margin-top: 20px;
          }
          .info h3 {
            color: #1f2937;
            margin-bottom: 8px;
            font-size: 18px;
            font-weight: 600;
          }
          .info p {
            color: #6b7280;
            margin: 0 0 10px 0;
            font-size: 14px;
          }
          .link {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px 16px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            word-break: break-all;
            text-align: center;
            max-width: 300px;
            margin: 0 auto;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            width: 100%;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
          }
          @media print {
            body { 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .qr-container {
              box-shadow: none !important;
              border: 1px solid #e5e7eb !important;
            }
          }
        </style>
      </head>
      <body onload="window.print()">
        <div class="header">
          <h1>${this.produto.nome}</h1>
          <p>QR Code para Visualização de Detalhes</p>
        </div>
        <div class="qr-container">
          <img class="qr-code" src="${this.qrCodeUrl}" alt="QR Code" />
          <div class="info">
            <h3>ID do Produto: ${this.produto.id}</h3>
            <p>Categoria: ${this.produto.categoria}</p>
            <p>${this.baseUrl}/produto/detalhes/${this.produto.id}</p>
          </div>
        </div>
        <div class="footer">
          <p>Sistema de Gestão de Estoque - FACENS</p>
          <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) { return; }
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Auto-imprime após carregar
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  }

  fecharQrCode(): void {
    this.qrCodeUrl = '';
    this.mostrandoQrCode = false;
  }
}