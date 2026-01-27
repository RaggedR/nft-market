import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../services/api_service.dart';
import '../providers/wallet_provider.dart';
import '../widgets/wallet_button.dart';

class GalleryPage extends StatefulWidget {
  final String? address;

  const GalleryPage({super.key, this.address});

  @override
  State<GalleryPage> createState() => _GalleryPageState();
}

class _GalleryPageState extends State<GalleryPage> {
  List<Map<String, dynamic>> _tokens = [];
  bool _loading = true;
  String? _error;
  String? _ownerAddress;

  @override
  void initState() {
    super.initState();
    _loadGallery();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Reload if viewing own gallery and wallet changes
    final wallet = context.read<WalletProvider>();
    final targetAddress = widget.address ?? wallet.address;
    if (targetAddress != _ownerAddress && targetAddress != null) {
      _loadGallery();
    }
  }

  Future<void> _loadGallery() async {
    final wallet = context.read<WalletProvider>();
    final targetAddress = widget.address ?? wallet.address;

    if (targetAddress == null) {
      setState(() {
        _loading = false;
        _tokens = [];
        _ownerAddress = null;
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
      _ownerAddress = targetAddress;
    });

    try {
      final api = ApiService();
      final tokens = await api.getGallery(targetAddress);
      setState(() {
        _tokens = tokens;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  bool get _isOwnGallery {
    final wallet = context.read<WalletProvider>();
    return widget.address == null ||
        wallet.address?.toLowerCase() == widget.address?.toLowerCase();
  }

  String get _pageTitle {
    if (widget.address == null) {
      return 'My Gallery';
    }
    final shortAddress =
        '${widget.address!.substring(0, 6)}...${widget.address!.substring(widget.address!.length - 4)}';
    return 'Gallery: $shortAddress';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_pageTitle),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/'),
        ),
        actions: const [
          WalletButton(),
          SizedBox(width: 16),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    final wallet = context.watch<WalletProvider>();

    // If viewing own gallery but not connected
    if (widget.address == null && !wallet.isConnected) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.account_balance_wallet,
                size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text('Connect your wallet to view your gallery',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => wallet.connect(),
              icon: const Icon(Icons.account_balance_wallet),
              label: const Text('Connect Wallet'),
            ),
          ],
        ),
      );
    }

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text('Error loading gallery',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(_error!, style: TextStyle(color: Colors.grey.shade600)),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadGallery,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_tokens.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.collections_outlined,
                size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              _isOwnGallery ? 'No artworks yet' : 'This gallery is empty',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Colors.grey.shade600,
                  ),
            ),
            if (_isOwnGallery) ...[
              const SizedBox(height: 8),
              Text(
                'Mint your first NFT or buy one from the marketplace!',
                style: TextStyle(color: Colors.grey.shade500),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ElevatedButton.icon(
                    onPressed: () => context.go('/mint'),
                    icon: const Icon(Icons.add),
                    label: const Text('Mint Art'),
                  ),
                  const SizedBox(width: 16),
                  OutlinedButton.icon(
                    onPressed: () => context.go('/marketplace'),
                    icon: const Icon(Icons.storefront),
                    label: const Text('Browse Marketplace'),
                  ),
                ],
              ),
            ],
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadGallery,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: GridView.builder(
          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
            maxCrossAxisExtent: 300,
            childAspectRatio: 0.85,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
          ),
          itemCount: _tokens.length,
          itemBuilder: (context, index) {
            final token = _tokens[index];
            return _TokenCard(
              token: token,
              onTap: () => context.go('/token/${token['tokenId']}'),
            );
          },
        ),
      ),
    );
  }
}

class _TokenCard extends StatelessWidget {
  final Map<String, dynamic> token;
  final VoidCallback onTap;

  const _TokenCard({required this.token, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final name = token['name'] ?? 'NFT #${token['tokenId']}';
    final previewUrl = token['previewUrl'];
    final licenseType = token['licenseType'] ?? 'unknown';
    final creator = token['creator'] ?? '';
    final shortCreator = creator.length > 10
        ? '${creator.substring(0, 6)}...${creator.substring(creator.length - 4)}'
        : creator;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: previewUrl != null
                  ? Image.network(
                      previewUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _placeholder(),
                    )
                  : _placeholder(),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Theme.of(context)
                          .colorScheme
                          .primary
                          .withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      _formatLicenseType(licenseType),
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.w500,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Creator: $shortCreator',
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatLicenseType(String type) {
    switch (type) {
      case 'display':
        return 'Display License';
      case 'commercial':
        return 'Commercial License';
      case 'transfer':
        return 'Full Copyright';
      default:
        return type;
    }
  }

  Widget _placeholder() {
    return Container(
      color: Colors.grey.shade200,
      child: Icon(Icons.image, size: 48, color: Colors.grey.shade400),
    );
  }
}
