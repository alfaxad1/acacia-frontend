import { useState } from "react";
import { UserPlus, Edit, Trash2, EyeOff, Eye, Lock, ChevronRight } from "lucide-react";
import { Table } from "../components/Table";
import { Modal } from "../components/Modal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { useApi } from "../hooks/useApi";
import { membersApi } from "../services/api";
import { formatDate, getStatusColor } from "../utils/format";
import { Role, type Member, type MemberRequest } from "../types";
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

  const role: Role = (localStorage.getItem("role") as Role) || "MEMBER";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<MemberRequest>({
    fullName: "",
    phone: "",
    email: "",
    joinDate: new Date().toISOString().split("T")[0],
    role: Role.MEMBER,
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedMemberMobile, setSelectedMemberMobile] = useState<Member | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await membersApi.create(formData);
      setIsModalOpen(false);
      setSelectedMember(null);
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        joinDate: "",
        password: "",
        role: Role.MEMBER,
      });
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
      role: member.role,
    });
    setIsModalOpen(true);
    setSelectedMemberMobile(null);
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
    <div className="space-y-4 md:space-y-6 px-2 sm:px-4 md:px-0">
      {/* Header Section - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            Manage your SACCO members
          </p>
        </div>
        {role === "ADMIN" && (
          <button
            onClick={() => {
              setSelectedMember(null);
              setFormData({
                fullName: "",
                phone: "",
                email: "",
                joinDate: new Date().toISOString().split("T")[0],
                role: Role.MEMBER,
                password: "",
              });
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <UserPlus size={18} className="sm:w-5 sm:h-5" />
            Add Member
          </button>
        )}
      </div>

      {/* Table Container - Mobile Optimized */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Mobile View: Card Layout */}
        <div className="block md:hidden">
          {(members || []).map((member) => (
            <div
              key={member.id}
              className="border-b last:border-b-0 p-4 hover:bg-gray-50 transition-colors"
              onClick={() => setSelectedMemberMobile(member)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {member.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.fullName}</h3>
                    <p className="text-xs text-gray-500">{member.memberNumber}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-gray-900">{member.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-gray-900 truncate">{member.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Join Date</p>
                  <p className="text-gray-900">{formatDate(member.joinDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      member.status
                    )}`}
                  >
                    {member.status}
                  </span>
                </div>
              </div>

              {role === "ADMIN" && (
                <div className="flex gap-2 mt-3 pt-2 border-t">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(member);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table columns={columns} data={members || []} />
        </div>
      </div>

      {/* Mobile Member Details Modal */}
      {selectedMemberMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:hidden"
          onClick={() => setSelectedMemberMobile(null)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Member Details</h3>
              <button
                onClick={() => setSelectedMemberMobile(null)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <EyeOff size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                  {selectedMemberMobile.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedMemberMobile.fullName}</h2>
                  <p className="text-sm text-gray-500">{selectedMemberMobile.memberNumber}</p>
                </div>
              </div>

              <div className="space-y-3">
                <DetailRow label="Phone" value={selectedMemberMobile.phone} />
                <DetailRow label="Email" value={selectedMemberMobile.email} />
                <DetailRow label="Join Date" value={formatDate(selectedMemberMobile.joinDate)} />
                <DetailRow 
                  label="Status" 
                  value={
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        selectedMemberMobile.status
                      )}`}
                    >
                      {selectedMemberMobile.status}
                    </span>
                  } 
                />
                {selectedMemberMobile.role && (
                  <DetailRow label="Role" value={selectedMemberMobile.role} />
                )}
              </div>

              {role === "ADMIN" && (
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      handleEdit(selectedMemberMobile);
                      setSelectedMemberMobile(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Edit size={18} />
                    Edit Member
                  </button>
                  <button
                    onClick={() => {
                      // Handle delete
                      setSelectedMemberMobile(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal - Keep as is but ensure it's mobile friendly */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedMember ? "Edit Member" : "Add New Member"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
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
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {/*Password*/}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password || ""}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter your password"
                required={!selectedMember}
                className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as Role })
              }
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={Role.MEMBER}>Member</option>
              <option value={Role.ADMIN}>Admin</option>
            </select>
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
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 sticky bottom-0 bg-white pb-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
            >
              {submitting ? "Saving..." : selectedMember ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Helper component for detail rows
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}