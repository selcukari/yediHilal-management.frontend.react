import { Container, Title, Text, Stack, List, ThemeIcon } from '@mantine/core';
import { IconShieldLock } from '@tabler/icons-react';

export default function PrivacyPolicy() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Başlık */}
        <div>
          <ThemeIcon size={60} radius="md" variant="light" color="blue" mb="md">
            <IconShieldLock size={30} />
          </ThemeIcon>
          <Title order={1} mb="md">
            Gizlilik Politikası
          </Title>
          <Text c="dimmed" size="lg">
            Son güncellenme: {new Date().toLocaleDateString('tr-TR')}
          </Text>
        </div>

        {/* Giriş */}
        <div>
          <Title order={2} mb="md">
            Giriş
          </Title>
          <Text>
            Yedihilal Management ({window.location.hostname}) olarak, ziyaretçilerimizin ve kullanıcılarımızın 
            gizliliğini önemsiyoruz. Bu gizlilik politikası, kişisel verilerinizin nasıl toplandığını, 
            kullanıldığını ve korunduğunu açıklamaktadır.
          </Text>
        </div>

        {/* Toplanan Veriler */}
        <div>
          <Title order={2} mb="md">
            Topladığımız Veriler
          </Title>
          <Text mb="sm">Hizmetlerimizi sağlamak için aşağıdaki türden verileri toplayabiliriz:</Text>
          <List
            spacing="sm"
            size="sm"
            center
            icon={
              <ThemeIcon color="blue" size={24} radius="xl">
                <IconShieldLock size={12} />
              </ThemeIcon>
            }
          >
            <List.Item>
              <Text fw={500}>Kişisel Bilgiler:</Text> Ad, soyad, e-posta adresi, telefon numarası
            </List.Item>
            <List.Item>
              <Text fw={500}>Kullanım Verileri:</Text> IP adresi, tarayıcı türü, işletim sistemi, sayfa ziyaretleri
            </List.Item>
            <List.Item>
              <Text fw={500}>Çerezler:</Text> Web sitesi deneyiminizi iyileştirmek için çerezler kullanıyoruz
            </List.Item>
            <List.Item>
              <Text fw={500}>İşlem Verileri:</Text> Sipariş bilgileri, ödeme detayları (güvenli bir şekilde)
            </List.Item>
          </List>
        </div>

        {/* Veri Kullanımı */}
        <div>
          <Title order={2} mb="md">
            Verilerinizi Nasıl Kullanıyoruz?
          </Title>
          <List
            spacing="sm"
            size="sm"
            icon={
              <ThemeIcon color="green" size={24} radius="xl">
                <IconShieldLock size={12} />
              </ThemeIcon>
            }
          >
            <List.Item>Hizmetlerimizi sağlamak ve iyileştirmek</List.Item>
            <List.Item>Müşteri desteği sunmak</List.Item>
            <List.Item>Güvenliği sağlamak ve dolandırıcılığı önlemek</List.Item>
            <List.Item>Yasal yükümlülükleri yerine getirmek</List.Item>
            <List.Item>Size önemli bildirimler göndermek</List.Item>
          </List>
        </div>

        {/* Veri Paylaşımı */}
        <div>
          <Title order={2} mb="md">
            Veri Paylaşımı
          </Title>
          <Text>
            Kişisel verilerinizi, yasal zorunluluklar dışında üçüncü taraflarla paylaşmıyoruz. 
            Sadece aşağıdaki durumlarda sınırlı erişim sağlanabilir:
          </Text>
          <List
            spacing="sm"
            size="sm"
            mt="sm"
            icon={
              <ThemeIcon color="orange" size={24} radius="xl">
                <IconShieldLock size={12} />
              </ThemeIcon>
            }
          >
            <List.Item>Yasal olarak zorunlu olduğunda</List.Item>
            <List.Item>Hizmet sağlayıcılarımız (sadece gerekli olduğu kadar)</List.Item>
            <List.Item>İş ortaklarımız (açık onayınızla)</List.Item>
          </List>
        </div>

        {/* Veri Güvenliği */}
        <div>
          <Title order={2} mb="md">
            Veri Güvenliği
          </Title>
          <Text>
            Verilerinizin güvenliğini sağlamak için uygun teknik ve organizasyonel önlemleri alıyoruz. 
            Ancak, internet üzerinden hiçbir veri iletiminin %100 güvenli olmadığını unutmayın.
          </Text>
        </div>

        {/* Çerezler */}
        <div>
          <Title order={2} mb="md">
            Çerez Politikası
          </Title>
          <Text>
            Web sitemiz, kullanıcı deneyimini iyileştirmek ve site trafiğini analiz etmek için çerezler 
            kullanmaktadır. Tarayıcınızın ayarlarından çerezleri kontrol edebilirsiniz.
          </Text>
        </div>

        {/* Haklarınız */}
        <div>
          <Title order={2} mb="md">
            Haklarınız
          </Title>
          <Text mb="sm">Kişisel verilerinizle ilgili olarak aşağıdaki haklara sahipsiniz:</Text>
          <List
            spacing="sm"
            size="sm"
            icon={
              <ThemeIcon color="violet" size={24} radius="xl">
                <IconShieldLock size={12} />
              </ThemeIcon>
            }
          >
            <List.Item>Verilerinize erişim hakkı</List.Item>
            <List.Item>Düzeltme hakkı</List.Item>
            <List.Item>Silme hakkı ("unutmaya hak")</List.Item>
            <List.Item>İşleme itiraz hakkı</List.Item>
            <List.Item>Veri taşınabilirliği hakkı</List.Item>
          </List>
        </div>

        {/* İletişim */}
        <div>
          <Title order={2} mb="md">
            İletişim
          </Title>
          <Text>
            Gizlilik politikamızla ilgili herhangi bir sorunuz varsa, lütfen bizimle iletişime geçin:
          </Text>
          <List
            spacing="xs"
            size="sm"
            mt="sm"
          >
            <List.Item>
              <Text fw={500}>E-posta:</Text> privacy@yedihilal.com
            </List.Item>
            <List.Item>
              <Text fw={500}>Adres:</Text> [Şirket Adresi]
            </List.Item>
          </List>
        </div>

        {/* Değişiklikler */}
        <div>
          <Title order={2} mb="md">
            Politika Değişiklikleri
          </Title>
          <Text>
            Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Değişiklikler yürürlüğe girdiğinde 
            web sitemizde yayınlayacağız. Değişiklikleri düzenli olarak kontrol etmenizi öneririz.
          </Text>
        </div>
      </Stack>
    </Container>
  );
}