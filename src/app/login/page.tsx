import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-2xl">FamiTalk</CardTitle>
          <CardDescription>Войдите в свой аккаунт</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <Input 
                type="email" 
                placeholder="Email" 
                className="w-full"
              />
            </div>
            <div>
              <Input 
                type="password" 
                placeholder="Пароль" 
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full">
              Войти
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-600">
            Нет аккаунта?{" "}
            <a href="/register" className="text-blue-600 hover:underline">
              Зарегистрироваться
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}