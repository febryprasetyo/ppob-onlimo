"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, User as UserIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface User {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        setUsername("");
        setPassword("");
        setOpen(false);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add user");
      }
    } catch (error) {
      alert("Error adding user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-in-bottom">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
            <div className="p-3 premium-gradient rounded-2xl shadow-xl shadow-blue-500/20">
              <UserIcon className="h-8 w-8 text-white" />
            </div>
            <span className="text-gradient">User Management</span>
          </h1>
          <p className="text-slate-500 mt-3 font-bold text-sm uppercase tracking-widest pl-1 border-l-4 border-blue-500 ml-1">
            Access Control • Administration Unit
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="premium-gradient hover:opacity-95 text-white shadow-xl shadow-blue-500/20 transition-all active:scale-95 h-16 rounded-2xl px-10 font-black uppercase text-xs tracking-widest flex gap-3">
              <Plus className="h-5 w-5" /> Tambah User Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className="premium-gradient p-10 text-white">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black tracking-tight">Tambah User</DialogTitle>
                <p className="text-blue-100 font-bold text-sm mt-2 opacity-80">Daftarkan operator sistem baru.</p>
              </DialogHeader>
            </div>
            
            <form onSubmit={handleAddUser} className="p-10 space-y-6 bg-white">
              <div className="space-y-2">
                <Label htmlFor="username" className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 pl-1">Identitas Username</Label>
                <Input
                  id="username"
                  placeholder="Contoh: admin_pusat"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold text-slate-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 pl-1">Password Keamanan</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold text-slate-700"
                  required
                />
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <Button type="submit" className="w-full h-16 rounded-2xl premium-gradient text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all" disabled={loading}>
                  {loading ? "SAVING..." : "Daftarkan User"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-14 rounded-2xl font-bold text-slate-400 hover:text-slate-600">Batalkan</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden rounded-[2.5rem] bg-white group">
        <CardHeader className="bg-gradient-to-br from-slate-50 via-white to-transparent border-b border-slate-100 py-8 px-8">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-slate-900 rounded-3xl shadow-2xl shadow-slate-500/30 group-hover:scale-110 transition-transform duration-500">
              <UserIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Daftar Pengguna Sistem</CardTitle>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">Authorized Personnel • Active Operators</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto no-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="py-6 pl-8 font-black uppercase tracking-widest text-[10px] text-slate-400">Username</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Role Authority</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Registered At</TableHead>
                  <TableHead className="text-right pr-8 font-black uppercase tracking-widest text-[10px] text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-slate-50 transition-all border-slate-50">
                    <TableCell className="pl-8 font-black text-slate-900 group-hover:text-blue-600 transition-colors py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all uppercase">
                          {user.username.charAt(0)}
                        </div>
                        <span className="uppercase tracking-wider text-sm">{user.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all shadow-sm ${
                        user.role === "admin" 
                          ? "bg-blue-50 text-blue-600 border-blue-100" 
                          : "bg-slate-50 text-slate-600 border-slate-100"
                      }`}>
                        {user.role}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400 font-bold uppercase text-[10px] tracking-widest font-mono">
                      {new Date(user.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="inline-flex items-center gap-2 text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Active Access</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
