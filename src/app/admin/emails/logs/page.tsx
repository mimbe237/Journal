'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface EmailSend {
  id: string;
  templateId: string | null;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  providerMessageId: string | null;
  createdAt: string;
  template: {
    id: string;
    slug: string;
    nom: string;
  } | null;
}

interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type StatusFilter = 'ALL' | 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'FAILED' | 'COMPLAINED';

const STATUS_OPTIONS: { value: StatusFilter; label: string; color: string }[] = [
  { value: 'ALL', label: 'Tous', color: 'bg-gray-100 text-gray-800' },
  { value: 'PENDING', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'SENT', label: 'Envoyé', color: 'bg-blue-100 text-blue-800' },
  { value: 'DELIVERED', label: 'Délivré', color: 'bg-green-100 text-green-800' },
  { value: 'OPENED', label: 'Ouvert', color: 'bg-purple-100 text-purple-800' },
  { value: 'CLICKED', label: 'Cliqué', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'BOUNCED', label: 'Rebondi', color: 'bg-orange-100 text-orange-800' },
  { value: 'FAILED', label: 'Échoué', color: 'bg-red-100 text-red-800' },
  { value: 'COMPLAINED', label: 'Plainte', color: 'bg-red-100 text-red-800' },
];

function getStatusColor(status: string): string {
  const found = STATUS_OPTIONS.find(s => s.value === status);
  return found?.color || 'bg-gray-100 text-gray-800';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EmailLogsPage() {
  const [sends, setSends] = useState<EmailSend[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchEmail, setSearchEmail] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchSends = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '25',
      });
      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }
      if (searchEmail.trim()) {
        params.set('email', searchEmail.trim());
      }

      const res = await fetch(`/api/admin/emails/sends?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSends(data.sends);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching email sends:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchEmail]);

  useEffect(() => {
    fetchSends();
  }, [fetchSends]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchEmail]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Logs d&apos;envoi</h1>
            <p className="text-sm text-gray-500 mt-1">
              Historique de tous les emails envoyés
            </p>
          </div>
          <Link
            href="/admin/emails/templates"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Retour aux templates
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher par email
            </label>
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={fetchSends}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats summary */}
      {pagination && (
        <div className="mb-4 text-sm text-gray-600">
          {pagination.total} envoi{pagination.total > 1 ? 's' : ''} trouvé{pagination.total > 1 ? 's' : ''}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Chargement...
          </div>
        ) : sends.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucun envoi trouvé
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destinataire
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sujet
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sends.map((send) => (
                <>
                  <tr key={send.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(send.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-gray-900">{send.recipientEmail}</div>
                      {send.recipientName && (
                        <div className="text-gray-500 text-xs">{send.recipientName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                      {send.subject}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {send.template ? (
                        <Link
                          href={`/admin/emails/templates/${send.template.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {send.template.slug}
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(send.status)}`}>
                        {STATUS_OPTIONS.find(s => s.value === send.status)?.label || send.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setExpandedRow(expandedRow === send.id ? null : send.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {expandedRow === send.id ? 'Masquer' : 'Détails'}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === send.id && (
                    <tr key={`${send.id}-details`}>
                      <td colSpan={6} className="px-4 py-4 bg-gray-50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Envoyé:</span>
                            <br />
                            {formatDate(send.sentAt)}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Délivré:</span>
                            <br />
                            {formatDate(send.deliveredAt)}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Ouvert:</span>
                            <br />
                            {formatDate(send.openedAt)}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Cliqué:</span>
                            <br />
                            {formatDate(send.clickedAt)}
                          </div>
                          {send.bouncedAt && (
                            <div>
                              <span className="font-medium text-orange-700">Rebondi:</span>
                              <br />
                              {formatDate(send.bouncedAt)}
                            </div>
                          )}
                          {send.failedAt && (
                            <div>
                              <span className="font-medium text-red-700">Échoué:</span>
                              <br />
                              {formatDate(send.failedAt)}
                            </div>
                          )}
                          {send.errorMessage && (
                            <div className="col-span-2">
                              <span className="font-medium text-red-700">Erreur:</span>
                              <br />
                              <code className="text-xs bg-red-50 px-2 py-1 rounded">
                                {send.errorMessage}
                              </code>
                            </div>
                          )}
                          {send.providerMessageId && (
                            <div className="col-span-2">
                              <span className="font-medium text-gray-700">Provider ID:</span>
                              <br />
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {send.providerMessageId}
                              </code>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {pagination.page} sur {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Précédent
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages}
              className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
