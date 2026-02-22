import { useState } from "react";
import { UserPlus, Edit, Trash2 } from "lucide-react";
import { Table } from "../components/Table";
import { Modal } from "../components/Modal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { useApi } from "../hooks/useApi";
import { membersApi } from "../services/api";
import { formatDate, getStatusColor } from "../utils/format";
import type { Member, MemberRequest } from "../types";
import toast from "react-hot-toast";

export function Members() {
  const {
    data: members,
    loading,
    error,
    refetch,
  } = useApi(async () => {
    const response = await membersApi.getAll();
    return { data: response };
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<MemberRequest>({
    fullName: "",
    phone: "",
    email: "",
    joinDate: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedMember) {
        await membersApi.create(formData);
      }
      setIsModalOpen(false);
      setSelectedMember(null);
      setFormData({ fullName: "", phone: "", email: "", joinDate: "" });
      toast.success(
        selectedMember
          ? "Member updated successfully"
          : "Member created successfully"
      );
      refetch();
    } catch (err) {
      console.error("Failed to save member:", err);
      toast.error(
        err instanceof Error ? err.message : "An error occurred while saving"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setFormData({
      id: member.id,
      fullName: member.fullName,
      phone: member.phone,
      email: member.email,
      joinDate: member.joinDate,
    });
    setIsModalOpen(true);
  };

  const columns = [
    {
      key: "memberNumber",
      header: "Member No.",
      render: (member: Member) => (
        <span className="font-medium">{member.memberNumber}</span>
      ),
    },
    {
      key: "fullName",
      header: "Full Name",
      render: (member: Member) => member.fullName,
    },
    {
      key: "phone",
      header: "Phone",
      render: (member: Member) => member.phone,
    },
    {
      key: "email",
      header: "Email",
      render: (member: Member) => member.email,
    },
    {
      key: "joinDate",
      header: "Join Date",
      render: (member: Member) => formatDate(member.joinDate),
    },
    {
      key: "status",
      header: "Status",
      render: (member: Member) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            member.status
          )}`}
        >
          {member.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (member: Member) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(member);
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="p-1 text-red-600 hover:text-red-800"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your SACCO members
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedMember(null);
            setFormData({
              fullName: "",
              phone: "",
              email: "",
              joinDate: new Date().toISOString().split("T")[0],
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus size={20} />
          Add Member
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={members || []} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedMember ? "Edit Member" : "Add New Member"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {/*Password*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={formData.password || ""}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Join Date
            </label>
            <input
              type="date"
              required
              value={formData.joinDate}
              onChange={(e) =>
                setFormData({ ...formData, joinDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : selectedMember ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
