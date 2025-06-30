// pages/admin.tsx
"use client";

import { useState, useEffect, useCallback } from "react"; // Added useCallback
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Edit, Trash2, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Switch } from "@/components/ui/switch"; // Import Switch component
import type { Celebrity, CelebrityAlias } from "@/lib/database"; // Ensure Celebrity interface includes is_celebrity

// Add this utility function at the top of the component:
const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

export default function AdminPage() {
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [aliases, setAliases] = useState<{ [key: number]: CelebrityAlias[] }>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // Thêm dòng này

  // Form states
  const [newCelebrity, setNewCelebrity] = useState({
    name: "",
    imageUrl: "",
    isCelebrity: false,
  }); // Add isCelebrity
  const [editingCelebrity, setEditingCelebrity] = useState<Celebrity | null>(
    null
  );
  const [newAlias, setNewAlias] = useState({ celebrityId: 0, alias: "" });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAliasDialog, setShowAliasDialog] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch celebrities
      const celebResponse = await fetch("/api/celebrities");
      const celebData = await celebResponse.json();
      setCelebrities(celebData);

      // Fetch aliases for each celebrity
      const aliasPromises = celebData.map(async (celebrity: Celebrity) => {
        const aliasResponse = await fetch(
          `/api/celebrities/${celebrity.id}/aliases`
        );
        const aliasData = await aliasResponse.json();
        return { celebrityId: celebrity.id, aliases: aliasData };
      });

      const aliasResults = await Promise.all(aliasPromises);
      const aliasMap: { [key: number]: CelebrityAlias[] } = {};
      aliasResults.forEach((result) => {
        aliasMap[result.celebrityId] = result.aliases;
      });
      setAliases(aliasMap);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  }, []); // fetchData no longer depends on external state

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Add fetchData to dependency array

  const handleAddCelebrity = async () => {
    try {
      const response = await fetch("/api/celebrities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCelebrity.name,
          imageUrl: newCelebrity.imageUrl,
          isCelebrity: newCelebrity.isCelebrity, // Pass isCelebrity
        }),
      });

      if (response.ok) {
        setNewCelebrity({ name: "", imageUrl: "", isCelebrity: false });
        setShowAddDialog(false);
        fetchData();
      } else {
        console.error("Failed to add celebrity:", response.statusText);
      }
    } catch (error) {
      console.error("Lỗi khi thêm người nổi tiếng:", error);
    }
  };

  const handleEditCelebrity = async () => {
    if (!editingCelebrity) return;

    try {
      const response = await fetch(`/api/celebrities/${editingCelebrity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingCelebrity.name,
          imageUrl: editingCelebrity.image_url,
          isCelebrity: editingCelebrity.is_celebrity, // Pass is_celebrity
        }),
      });

      if (response.ok) {
        setEditingCelebrity(null);
        setShowEditDialog(false);
        fetchData();
      } else {
        console.error("Failed to update celebrity:", response.statusText);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật người nổi tiếng:", error);
    }
  };

  // New handler for toggling is_celebrity
  const handleToggleIsCelebrity = async (
    celebrityId: number,
    currentStatus: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/celebrities/${celebrityId}/toggle-is-celebrity`,
        {
          // Assuming this new API endpoint
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isCelebrity: !currentStatus }),
        }
      );

      if (response.ok) {
        fetchData(); // Re-fetch data to reflect the change
      } else {
        console.error(
          "Failed to toggle is_celebrity status:",
          response.statusText
        );
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái người nổi tiếng:", error);
    }
  };

  const handleAddAlias = async () => {
    try {
      const response = await fetch(
        `/api/celebrities/${newAlias.celebrityId}/aliases`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alias: newAlias.alias }),
        }
      );

      if (response.ok) {
        const addedAlias = await response.json();
        setAliases((prev) => ({
          ...prev,
          [newAlias.celebrityId]: [
            ...(prev[newAlias.celebrityId] || []),
            addedAlias,
          ],
        }));
        setNewAlias({ celebrityId: 0, alias: "" });
        setShowAliasDialog(false);
        // Không cần fetchData();
      } else {
        console.error("Failed to add alias:", response.statusText);
      }
    } catch (error) {
      console.error("Lỗi khi thêm biệt danh:", error);
    }
  };

  const handleDeleteAlias = async (aliasId: number) => {
    try {
      const response = await fetch(`/api/aliases/${aliasId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      } else {
        console.error("Failed to delete alias:", response.statusText);
      }
    } catch (error) {
      console.error("Lỗi khi xóa biệt danh:", error);
    }
  };

  const filteredCelebrities = celebrities.filter((celeb) =>
    celeb.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">
                Quản trị hệ thống
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-end mb-4">
          <Input
            type="text"
            placeholder="Tìm kiếm người nổi tiếng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-xs"
          />
        </div>
        <Tabs defaultValue="celebrities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="celebrities"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Người nổi tiếng
            </TabsTrigger>
            <TabsTrigger value="aliases" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Biệt danh
            </TabsTrigger>
          </TabsList>

          {/* Celebrities Tab */}
          <TabsContent value="celebrities">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Quản lý người nổi tiếng</CardTitle>
                    <CardDescription>
                      Thêm, sửa, xóa thông tin người nổi tiếng và ảnh đại diện
                    </CardDescription>
                  </div>
                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm mới
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Thêm người nổi tiếng mới</DialogTitle>
                        <DialogDescription>
                          Nhập thông tin người nổi tiếng mới vào hệ thống
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Tên</Label>
                          <Input
                            id="name"
                            value={newCelebrity.name}
                            onChange={(e) =>
                              setNewCelebrity({
                                ...newCelebrity,
                                name: e.target.value,
                              })
                            }
                            placeholder="Nhập tên người nổi tiếng"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="imageUrl">URL ảnh</Label>
                          <Input
                            id="imageUrl"
                            value={newCelebrity.imageUrl}
                            onChange={(e) =>
                              setNewCelebrity({
                                ...newCelebrity,
                                imageUrl: e.target.value,
                              })
                            }
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is-celebrity-new"
                            checked={newCelebrity.isCelebrity}
                            onCheckedChange={(checked) =>
                              setNewCelebrity({
                                ...newCelebrity,
                                isCelebrity: checked,
                              })
                            }
                          />
                          <Label htmlFor="is-celebrity-new">
                            Là người nổi tiếng chính thức?
                          </Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowAddDialog(false)}
                        >
                          Hủy
                        </Button>
                        <Button onClick={handleAddCelebrity}>Thêm</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCelebrities.map((celebrity) => (
                    <div
                      key={celebrity.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center space-x-3">
                        <Image
                          src={
                            celebrity.image_url ||
                            "https://th.bing.com/th/id/R.901e99bb748d37365416ab41fbbb3615?rik=tPG7ldxjzp4SQA&pid=ImgRaw&r=0"
                          }
                          alt={celebrity.name}
                          width={32}
                          height={32}
                          className="object-cover rounded-full"
                          style={{
                            objectFit: "cover",
                            aspectRatio: "1/1",
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{celebrity.name}</h3>
                          <p className="text-sm text-gray-500">
                            ID: {celebrity.id}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCelebrity(celebrity);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setNewAlias({
                              celebrityId: celebrity.id,
                              alias: "",
                            });
                            setShowAliasDialog(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Biệt danh
                        </Button>
                        {/* New Toggle for is_celebrity */}
                        <div className="flex items-center space-x-2 ml-auto">
                          <Switch
                            id={`is-celebrity-${celebrity.id}`}
                            checked={celebrity.is_celebrity}
                            onCheckedChange={() =>
                              handleToggleIsCelebrity(
                                celebrity.id,
                                celebrity.is_celebrity
                              )
                            }
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aliases Tab */}
          <TabsContent value="aliases">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý biệt danh</CardTitle>
                <CardDescription>
                  Danh sách tất cả biệt danh của người nổi tiếng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {filteredCelebrities.map((celebrity) => (
                    <div key={celebrity.id} className="border rounded-lg p-4">
                      <div className="flex items-center flex-wrap gap-2 mb-3">
                        <Image
                          src={
                            celebrity.image_url ||
                            "https://th.bing.com/th/id/R.901e99bb748d37365416ab41fbbb3615?rik=tPG7ldxjzp4SQA&pid=ImgRaw&r=0"
                          }
                          alt={celebrity.name}
                          width={32}
                          height={32}
                          className="object-cover rounded-full"
                          style={{
                            objectFit: "cover",
                            aspectRatio: "1/1",
                          }}
                        />
                        <h3 className="font-medium  pr-10">{celebrity.name}</h3>
                        {aliases[celebrity.id]?.length ? (
                          aliases[celebrity.id].map((alias) => (
                            <Badge
                              key={alias.id}
                              variant="secondary"
                              className="flex items-center gap-2"
                            >
                              {alias.alias}
                              <Button
                                onClick={() => handleDeleteAlias(alias.id)}
                                className="ml-1 bg-transparent text-black hover:bg-transparent hover:text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">
                            Chưa có biệt danh
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Celebrity Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin người nổi tiếng
            </DialogDescription>
          </DialogHeader>
          {editingCelebrity && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Tên</Label>
                <Input
                  id="edit-name"
                  value={editingCelebrity.name}
                  onChange={(e) =>
                    setEditingCelebrity({
                      ...editingCelebrity,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-imageUrl">URL ảnh</Label>
                <Input
                  id="edit-imageUrl"
                  value={
                    editingCelebrity.image_url || "" // Default to empty string for input
                  }
                  onChange={(e) =>
                    setEditingCelebrity({
                      ...editingCelebrity,
                      image_url: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-celebrity-edit"
                  checked={editingCelebrity.is_celebrity}
                  onCheckedChange={(checked) =>
                    setEditingCelebrity({
                      ...editingCelebrity,
                      is_celebrity: checked,
                    })
                  }
                />
                <Label htmlFor="is-celebrity-edit">Là người nổi tiếng?</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleEditCelebrity}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Alias Dialog */}
      <Dialog open={showAliasDialog} onOpenChange={setShowAliasDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm biệt danh</DialogTitle>
            <DialogDescription>
              Thêm biệt danh mới cho người nổi tiếng
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="alias">Biệt danh</Label>
              <Input
                id="alias"
                value={newAlias.alias}
                onChange={(e) =>
                  setNewAlias({ ...newAlias, alias: e.target.value })
                }
                placeholder="Nhập biệt danh"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAliasDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddAlias}>Thêm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
